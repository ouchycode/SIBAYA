<?php

namespace Database\Seeders;

use App\Models\Mapping;
use App\Models\Period;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::query()->updateOrCreate(
            ['email' => 'admin@siba.local'],
            [
                'name' => 'Admin SIBA',
                'full_name' => 'Admin SIBA',
                'role' => 'admin',
                'password' => bcrypt('password'),
            ]
        );

        $dosen = User::query()->updateOrCreate(
            ['email' => 'dosen@siba.local'],
            [
                'name' => 'Dosen SIBA',
                'full_name' => 'Dosen SIBA',
                'role' => 'dosen',
                'nip' => '198501012010011001',
                'program_studi' => 'Teknik Informatika',
                'status' => 'active',
                'password' => bcrypt('password'),
            ]
        );

        $mahasiswa = User::query()->updateOrCreate(
            ['email' => 'mhs@siba.local'],
            [
                'name' => 'Mahasiswa SIBA',
                'full_name' => 'Mahasiswa SIBA',
                'role' => 'mahasiswa',
                'nim' => '2021010001',
                'program_studi' => 'Teknik Informatika',
                'status' => 'active',
                'password' => bcrypt('password'),
            ]
        );

        $period = Period::query()->updateOrCreate(
            ['name' => 'Semester Genap 2025/2026'],
            [
                'start_date' => '2026-02-01',
                'end_date' => '2026-07-31',
                'is_active' => true,
                'description' => 'Periode aktif bimbingan skripsi.',
            ]
        );

        Mapping::query()->updateOrCreate(
            [
                'student_email' => $mahasiswa->email,
                'supervisor_email' => $dosen->email,
            ],
            [
                'student_name' => $mahasiswa->full_name,
                'student_nim' => $mahasiswa->nim,
                'supervisor_name' => $dosen->full_name,
                'period_id' => $period->id,
                'thesis_title' => 'Implementasi Sistem Informasi Bimbingan Skripsi',
                'status' => 'active',
            ]
        );

        Slot::query()->updateOrCreate(
            [
                'supervisor_email' => $dosen->email,
                'date' => now()->addDays(1)->format('Y-m-d'),
                'start_time' => '09:00',
                'end_time' => '10:00',
            ],
            [
                'max_students' => 1,
                'current_bookings' => 0,
                'mode' => 'offline',
                'location' => 'Ruang Dosen B201',
                'period_id' => $period->id,
                'is_available' => true,
            ]
        );
    }
}
