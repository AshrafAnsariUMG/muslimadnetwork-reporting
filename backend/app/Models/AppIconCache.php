<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppIconCache extends Model
{
    protected $table = 'app_icon_cache';

    protected $fillable = [
        'bundle_id',
        'icon_url',
        'app_name',
        'fetched_at',
        'expires_at',
    ];

    protected $casts = [
        'fetched_at' => 'datetime',
        'expires_at' => 'datetime',
    ];
}
