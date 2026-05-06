<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'student_email',
        'student_name',
        'supervisor_email',
        'supervisor_name',
        'slot_id',
        'date',
        'start_time',
        'end_time',
        'mode',
        'location',
        'status',
        'notes',
        'reject_reason',
        'period_id',
    ];
}
