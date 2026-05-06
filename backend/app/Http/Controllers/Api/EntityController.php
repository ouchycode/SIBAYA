<?php

namespace App\Http\Controllers\Api;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Http\Controllers\Controller;
use App\Models\Logbook;
use App\Models\Mapping;
use App\Models\Notification;
use App\Models\Period;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class EntityController extends Controller
{
    private array $entityModels = [
        'user' => User::class,
        'period' => Period::class,
        'mapping' => Mapping::class,
        'slot' => Slot::class,
        'booking' => Booking::class,
        'logbook' => Logbook::class,
        'activitylog' => ActivityLog::class,
        'notification' => Notification::class,
    ];

    public function index(Request $request, string $entity)
    {
        $modelClass = $this->resolveModel($entity);
        abort_unless($modelClass, 404, 'Entity tidak ditemukan');
        $entity = strtolower($entity);

        $query = $modelClass::query();
        $this->applyRoleScope($request, $entity, $query);
        $ignored = ['order_by', 'limit', 'page'];
        foreach ($request->query() as $key => $value) {
            if (!in_array($key, $ignored, true) && $value !== null && $value !== '') {
                $query->where($key, $value);
            }
        }

        $orderBy = (string) $request->input('order_by', '-id');
        $direction = str_starts_with($orderBy, '-') ? 'desc' : 'asc';
        $column = ltrim($orderBy, '-');
        if ($column === 'created_date') {
            $column = 'created_at';
        }
        $query->orderBy($column, $direction);

        $limit = (int) $request->input('limit', 100);
        $items = $query->limit(max(1, min($limit, 500)))->get();

        return response()->json($items->map(fn ($item) => $this->transformDates($item->toArray())));
    }

    public function store(Request $request, string $entity)
    {
        $modelClass = $this->resolveModel($entity);
        abort_unless($modelClass, 404, 'Entity tidak ditemukan');
        $entity = strtolower($entity);

        if ($entity === 'user') {
            if (!$request->filled('password')) {
                $request->merge(['password' => 'password123']);
            }
            if (!$request->filled('name') && $request->filled('full_name')) {
                $request->merge(['name' => $request->input('full_name')]);
            }
        }

        $payload = $this->validatePayload($request, $entity);
        $payload = $this->sanitizePayload($entity, $payload);
        $this->authorizeCreate($request, $entity, $payload);
        $payload = $this->restrictPayloadByRole($request, $entity, $payload);

        // === BOOKING: Validasi & update kuota slot (1 slot = 1 mahasiswa) ===
        if ($entity === 'booking' && !empty($payload['slot_id'])) {
            $slot = Slot::find($payload['slot_id']);
            abort_unless($slot, 422, 'Slot tidak ditemukan.');

            // Cek apakah slot masih tersedia
            abort_unless($slot->is_available, 422, 'Slot ini sudah tidak tersedia. Silakan pilih jadwal lain.');

            // Cek apakah mahasiswa sudah booking slot ini (mencegah booking ganda)
            $alreadyBooked = Booking::where('slot_id', $slot->id)
                ->where('student_email', $payload['student_email'])
                ->whereIn('status', ['pending', 'approved'])
                ->exists();
            abort_if($alreadyBooked, 422, 'Anda sudah mengajukan booking untuk slot ini.');

            // Hitung booking aktif (1 slot hanya boleh 1 booking aktif)
            $activeCount = Booking::where('slot_id', $slot->id)
                ->whereIn('status', ['pending', 'approved'])
                ->count();

            abort_if($activeCount >= 1, 422, 'Slot ini sudah dibooking oleh mahasiswa lain. Silakan pilih jadwal lain.');

            // Tandai slot tidak tersedia lagi setelah berhasil dibooking
            $slot->update([
                'current_bookings' => 1,
                'is_available'     => false,
            ]);
        }

        $record = $modelClass::query()->create($payload);

        // ==== NOTIFICATIONS ====
        if ($entity === 'booking') {
            \App\Models\Notification::create([
                'recipient_email' => $record->supervisor_email,
                'title' => 'Pengajuan Bimbingan Baru',
                'message' => "Mahasiswa {$record->student_name} mengajukan bimbingan pada tanggal " . \Carbon\Carbon::parse($record->date)->format('d M Y') . ".",
                'type' => 'booking_new',
                'link' => '/requests',
            ]);
        }

        // ==== ACTIVITY LOGGING ====
        if ($entity !== 'activitylog' && $entity !== 'notification') {
            $user = $request->user();
            \App\Models\ActivityLog::create([
                'actor_email' => $user->email,
                'actor_name' => $user->name ?? $user->full_name ?? $user->email,
                'actor_role' => $user->role,
                'action' => "create_{$entity}",
                'description' => "Pengguna {$user->email} menambahkan data {$entity} baru.",
                'target_type' => $entity,
                'target_id' => (string) $record->id,
            ]);
        }

        return response()->json($this->transformDates($record->toArray()), 201);
    }

    public function update(Request $request, string $entity, int $id)
    {
        $modelClass = $this->resolveModel($entity);
        abort_unless($modelClass, 404, 'Entity tidak ditemukan');
        $entity = strtolower($entity);

        $record = $modelClass::query()->findOrFail($id);
        $this->authorizeRecordAccess($request, $entity, $record, 'update');
        $payload = $this->validatePayload($request, $entity, true, $record->id);
        $payload = $this->sanitizePayload($entity, $payload, true);
        $payload = $this->restrictPayloadByRole($request, $entity, $payload, true);
        $record->update($payload);

        // ==== NOTIFICATIONS ====
        if ($entity === 'booking' && $record->wasChanged('status')) {
            $newStatus = $record->status;
            $recipient = '';
            
            if ($newStatus === 'approved') {
                $recipient = $record->student_email;
                $title = 'Bimbingan Disetujui';
                $message = "Pengajuan bimbingan Anda pada tanggal " . \Carbon\Carbon::parse($record->date)->format('d M Y') . " telah disetujui.";
                $type = 'booking_approved';
                $link = '/my-bookings';
            } elseif ($newStatus === 'rejected') {
                $recipient = $record->student_email;
                $title = 'Bimbingan Ditolak';
                $message = "Pengajuan bimbingan Anda ditolak. Alasan: " . ($record->reject_reason ?? 'Tidak ada alasan');
                $type = 'booking_rejected';
                $link = '/my-bookings';
            } elseif ($newStatus === 'cancelled') {
                $recipient = $record->supervisor_email;
                $title = 'Bimbingan Dibatalkan';
                $message = "Mahasiswa {$record->student_name} telah membatalkan bimbingan.";
                $type = 'booking_cancelled';
                $link = '/requests';
            }

            if ($recipient) {
                \App\Models\Notification::create([
                    'recipient_email' => $recipient,
                    'title' => $title,
                    'message' => $message,
                    'type' => $type,
                    'link' => $link,
                ]);
            }
        }

        // === BOOKING: Sinkronisasi ulang kuota slot setelah status berubah ===
        if ($entity === 'booking' && !empty($record->slot_id)) {
            $slot = Slot::find($record->slot_id);
            if ($slot) {
                $newStatus = $payload['status'] ?? $record->status;

                // Jika bimbingan selesai (completed) → hapus slot agar tidak muncul lagi
                if ($newStatus === 'completed') {
                    $slot->delete();
                } elseif (in_array($newStatus, ['rejected', 'cancelled'])) {
                    // Jika ditolak/dibatalkan → kembalikan slot menjadi tersedia
                    $activeCount = Booking::where('slot_id', $slot->id)
                        ->whereIn('status', ['pending', 'approved'])
                        ->count();
                    $slot->update([
                        'current_bookings' => $activeCount,
                        'is_available'     => $activeCount < $slot->max_students,
                    ]);
                } else {
                    // Status lain → sinkronisasi biasa
                    $activeCount = Booking::where('slot_id', $slot->id)
                        ->whereIn('status', ['pending', 'approved'])
                        ->count();
                    $slot->update([
                        'current_bookings' => $activeCount,
                        'is_available'     => $activeCount < $slot->max_students,
                    ]);
                }
            }
        }

        // ==== ACTIVITY LOGGING ====
        if ($entity !== 'activitylog' && $entity !== 'notification') {
            $user = $request->user();
            
            $actionName = "update_{$entity}";
            $desc = "Pengguna {$user->email} memperbarui data {$entity} (ID: {$record->id}).";

            if ($entity === 'booking' && isset($payload['status'])) {
                $actionName = "{$payload['status']}_booking";
                $desc = "Status booking (ID: {$record->id}) diperbarui menjadi {$payload['status']}.";
            } elseif ($entity === 'mapping' && isset($payload['status']) && $payload['status'] === 'inactive') {
                $actionName = "deactivate_mapping";
                $desc = "Mapping dosen pembimbing (ID: {$record->id}) dinonaktifkan.";
            }

            \App\Models\ActivityLog::create([
                'actor_email' => $user->email,
                'actor_name' => $user->name ?? $user->full_name ?? $user->email,
                'actor_role' => $user->role,
                'action' => $actionName,
                'description' => $desc,
                'target_type' => $entity,
                'target_id' => (string) $record->id,
            ]);
        }

        return response()->json($this->transformDates($record->fresh()->toArray()));
    }

    public function destroy(string $entity, int $id)
    {
        $modelClass = $this->resolveModel($entity);
        abort_unless($modelClass, 404, 'Entity tidak ditemukan');
        $entity = strtolower($entity);

        $record = $modelClass::query()->findOrFail($id);
        $this->authorizeRecordAccess(request(), $entity, $record, 'delete');
        $record->delete();

        // ==== ACTIVITY LOGGING ====
        if ($entity !== 'activitylog' && $entity !== 'notification') {
            $user = request()->user();
            \App\Models\ActivityLog::create([
                'actor_email' => $user->email,
                'actor_name' => $user->name ?? $user->full_name ?? $user->email,
                'actor_role' => $user->role,
                'action' => "delete_{$entity}",
                'description' => "Pengguna {$user->email} menghapus data {$entity} (ID: {$id}).",
                'target_type' => $entity,
                'target_id' => (string) $id,
            ]);
        }

        return response()->json(status: 204);
    }

    private function resolveModel(string $entity): ?string
    {
        return $this->entityModels[strtolower($entity)] ?? null;
    }

    private function sanitizePayload(string $entity, array $payload, bool $isUpdate = false): array
    {
        if (strtolower($entity) === 'user' && Arr::has($payload, 'password')) {
            if (!empty($payload['password'])) {
                $payload['password'] = Hash::make((string) $payload['password']);
            } else {
                unset($payload['password']);
            }
        }

        return $payload;
    }

    private function validatePayload(Request $request, string $entity, bool $isUpdate = false, ?int $recordId = null): array
    {
        $rules = match ($entity) {
            'user' => [
                'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
                'full_name' => ['sometimes', 'nullable', 'string', 'max:255'],
                
                'email' => [$isUpdate ? 'sometimes' : 'required', 'email', Rule::unique('users', 'email')->ignore($recordId)],
                
                'password' => [$isUpdate ? 'sometimes' : 'required', 'string', 'min:6'],
                'role' => ['sometimes', 'in:admin,dosen,mahasiswa'],
                
                'nim' => ['sometimes', 'nullable', 'string', 'max:50', Rule::unique('users', 'nim')->ignore($recordId)],
                'nip' => ['sometimes', 'nullable', 'string', 'max:50', Rule::unique('users', 'nip')->ignore($recordId)],
                
                'program_studi' => ['sometimes', 'nullable', 'string', 'max:255'],
                'status' => ['sometimes', 'in:active,inactive,graduated,cuti'],
                'photo' => ['sometimes', 'nullable', 'string'],
            ],
            'period' => [
                'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
                'start_date' => [$isUpdate ? 'sometimes' : 'required', 'date'],
                'end_date' => [$isUpdate ? 'sometimes' : 'required', 'date'],
                'is_active' => ['sometimes', 'boolean'],
                'description' => ['sometimes', 'nullable', 'string'],
            ],
            'mapping' => [
                'student_email' => [$isUpdate ? 'sometimes' : 'required', 'email'],
                'student_name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
                'student_nim' => ['sometimes', 'nullable', 'string', 'max:100'],
                'supervisor_email' => [$isUpdate ? 'sometimes' : 'required', 'email'],
                'supervisor_name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
                'period_id' => ['sometimes', 'nullable', 'integer'],
                'thesis_title' => ['sometimes', 'nullable', 'string', 'max:255'],
                'status' => ['sometimes', 'in:active,inactive'],
            ],
            'slot' => [
                'supervisor_email' => ['sometimes', 'email'],
                'date' => [$isUpdate ? 'sometimes' : 'required', 'date'],
                'start_time' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:10'],
                'end_time' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:10'],
                'max_students' => ['sometimes', 'integer', 'min:1'],
                'current_bookings' => ['sometimes', 'integer', 'min:0'],
                'mode' => ['sometimes', 'in:online,offline'],
                'location' => ['sometimes', 'nullable', 'string', 'max:255'],
                'period_id' => ['sometimes', 'nullable', 'integer'],
                'is_available' => ['sometimes', 'boolean'],
            ],
            'booking' => [
                'student_email' => ['sometimes', 'email'],
                'student_name' => ['sometimes', 'string', 'max:255'],
                'supervisor_email' => ['sometimes', 'email'],
                'supervisor_name' => ['sometimes', 'string', 'max:255'],
                'slot_id' => ['sometimes', 'nullable', 'integer'],
                'date' => [$isUpdate ? 'sometimes' : 'required', 'date'],
                'start_time' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:10'],
                'end_time' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:10'],
                'mode' => ['sometimes', 'in:online,offline'],
                'location' => ['sometimes', 'nullable', 'string', 'max:255'],
                'status' => ['sometimes', 'in:pending,approved,rejected,completed,cancelled'],
                'notes' => ['sometimes', 'nullable', 'string'],
                'reject_reason' => ['sometimes', 'nullable', 'string'],
                'period_id' => ['sometimes', 'nullable', 'integer'],
            ],
            'logbook' => [
                'booking_id' => ['sometimes', 'nullable', 'integer'],
                'student_email' => [$isUpdate ? 'sometimes' : 'required', 'email'],
                'supervisor_email' => ['sometimes', 'email'],
                'date' => [$isUpdate ? 'sometimes' : 'required', 'date'],
                'summary' => ['sometimes', 'nullable', 'string'],
                'revisions' => ['sometimes', 'nullable', 'string'],
                'next_steps' => ['sometimes', 'nullable', 'string'],
                'progress_percentage' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100'],
                'validated_by_supervisor' => ['sometimes', 'boolean'],
            ],
            'activitylog' => [
                'actor_email' => ['sometimes', 'email'],
                'actor_name' => ['sometimes', 'nullable', 'string', 'max:255'],
                'actor_role' => ['sometimes', 'nullable', 'in:admin,dosen,mahasiswa'],
                'action' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:100'],
                'description' => [$isUpdate ? 'sometimes' : 'required', 'string'],
                'target_type' => ['sometimes', 'nullable', 'string', 'max:100'],
                'target_id' => ['sometimes', 'nullable', 'string', 'max:100'],
            ],
            'notification' => [
                'recipient_email' => [$isUpdate ? 'sometimes' : 'required', 'email'],
                'title' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
                'message' => [$isUpdate ? 'sometimes' : 'required', 'string'],
                'type' => ['sometimes', 'nullable', 'string', 'max:100'],
                'is_read' => ['sometimes', 'boolean'],
                'link' => ['sometimes', 'nullable', 'string', 'max:255'],
            ],
            default => [],
        };

        if (empty($rules)) {
            return $request->all();
        }

        return $request->validate($rules);
    }

    private function applyRoleScope(Request $request, string $entity, $query): void
    {
        $user = $request->user();
        if ($user->role === 'admin') {
            return;
        }

        if ($user->role === 'mahasiswa') {
            match ($entity) {
                'user' => $query->where('id', $user->id),
                'mapping' => $query->where('student_email', $user->email),
                'booking' => $query->where('student_email', $user->email),
                'logbook' => $query->where('student_email', $user->email),
                'notification' => $query->where('recipient_email', $user->email),
                'activitylog' => $query->where('actor_email', $user->email),
                'slot' => $query->whereIn('supervisor_email', function ($sub) use ($user) {
                    $sub->select('supervisor_email')
                        ->from('mappings')
                        ->where('student_email', $user->email)
                        ->where('status', 'active');
                }),
                default => abort(403, 'Akses ditolak'),
            };

            return;
        }

        if ($user->role === 'dosen') {
            match ($entity) {
                'user' => $query->where('id', $user->id),
                'mapping' => $query->where('supervisor_email', $user->email),
                'slot' => $query->where('supervisor_email', $user->email),
                'booking' => $query->where('supervisor_email', $user->email),
                'logbook' => $query->where('supervisor_email', $user->email),
                'notification' => $query->where('recipient_email', $user->email),
                'activitylog' => $query->where('actor_email', $user->email),
                default => abort(403, 'Akses ditolak'),
            };

            return;
        }

        abort(403, 'Role tidak dikenali');
    }

    private function authorizeCreate(Request $request, string $entity, array &$payload): void
    {
        $user = $request->user();
        if ($user->role === 'admin') {
            return;
        }

        if ($user->role === 'mahasiswa') {
            if ($entity === 'booking') {
                $payload['student_email'] = $user->email;
                $payload['student_name'] = $user->full_name;
                return;
            }

            if ($entity === 'activitylog') {
                $payload['actor_email'] = $user->email;
                $payload['actor_name'] = $user->full_name;
                $payload['actor_role'] = 'mahasiswa';
                return;
            }

            abort(403, 'Akses create ditolak');
        }

        if ($user->role === 'dosen') {
            if ($entity === 'slot') {
                $payload['supervisor_email'] = $user->email;
                return;
            }

            if ($entity === 'logbook') {
                $payload['supervisor_email'] = $user->email;
                return;
            }

            if ($entity === 'activitylog') {
                $payload['actor_email'] = $user->email;
                $payload['actor_name'] = $user->full_name;
                $payload['actor_role'] = 'dosen';
                return;
            }

            abort(403, 'Akses create ditolak');
        }
    }

    private function authorizeRecordAccess(Request $request, string $entity, object $record, string $action): void
    {
        $user = $request->user();
        if ($user->role === 'admin') {
            return;
        }

        if ($user->role === 'mahasiswa') {
            $allowed = match ($entity) {
                'user' => $record->id === $user->id,
                'booking' => $record->student_email === $user->email,
                'logbook' => $record->student_email === $user->email,
                'activitylog' => $record->actor_email === $user->email,
                'notification' => $record->recipient_email === $user->email,
                default => false,
            };

            abort_unless($allowed, 403, 'Akses ditolak');
            return;
        }

        if ($user->role === 'dosen') {
            $allowed = match ($entity) {
                'user' => $record->id === $user->id,
                'slot' => $record->supervisor_email === $user->email,
                'booking' => $record->supervisor_email === $user->email,
                'logbook' => $record->supervisor_email === $user->email,
                'mapping' => $record->supervisor_email === $user->email,
                'activitylog' => $record->actor_email === $user->email,
                'notification' => $record->recipient_email === $user->email,
                default => false,
            };

            abort_unless($allowed, 403, 'Akses ditolak');
            return;
        }

        abort(403, "Akses {$action} ditolak");
    }

    private function transformDates(array $item): array
    {
        if (isset($item['created_at'])) {
            $item['created_date'] = $item['created_at'];
        }
        return $item;
    }

    private function restrictPayloadByRole(Request $request, string $entity, array $payload, bool $isUpdate = false): array
    {
        $user = $request->user();
        if ($user->role === 'admin') {
            return $payload;
        }

        if ($entity === 'user') {
            return Arr::only($payload, ['name', 'full_name', 'password', 'photo']);
        }

        if ($user->role === 'dosen' && $entity === 'booking' && $isUpdate) {
            return Arr::only($payload, ['status', 'reject_reason', 'notes']);
        }

        if ($user->role === 'mahasiswa' && $entity === 'booking' && $isUpdate) {
            return Arr::only($payload, ['status', 'notes']);
        }

        return $payload;
    }
}
