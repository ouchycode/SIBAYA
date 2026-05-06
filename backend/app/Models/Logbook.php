<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Logbook extends Model
{
    protected $fillable = [
        'booking_id',
        'student_email',
        'supervisor_email',
        'date',
        'summary',
        'revisions',
        'next_steps',
        'progress_percentage',
        'validated_by_supervisor',
    ];
}
