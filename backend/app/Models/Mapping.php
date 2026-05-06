<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mapping extends Model
{
    protected $fillable = [
        'student_email',
        'student_name',
        'student_nim',
        'supervisor_email',
        'supervisor_name',
        'period_id',
        'thesis_title',
        'status',
    ];
}
