<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'actor_email',
        'actor_name',
        'actor_role',
        'action',
        'description',
        'target_type',
        'target_id',
    ];
}
