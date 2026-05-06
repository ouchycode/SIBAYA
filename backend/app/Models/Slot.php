<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Slot extends Model
{
    protected $fillable = [
        'supervisor_email',
        'date',
        'start_time',
        'end_time',
        'max_students',
        'current_bookings',
        'mode',
        'location',
        'period_id',
        'is_available',
    ];
}
