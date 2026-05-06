<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'recipient_email',
        'title',
        'message',
        'type',
        'is_read',
        'link',
    ];
}
