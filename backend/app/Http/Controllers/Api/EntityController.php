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
        $record = $modelClass::query()->create($payload);
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
            return Arr::only($payload, ['name', 'full_name', 'password']);
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
