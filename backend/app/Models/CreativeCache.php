<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreativeCache extends Model
{
    protected $table = 'creative_cache';

    protected $fillable = [
        'campaign_id',
        'cm360_creative_id',
        'name',
        'type',
        'width',
        'height',
        'preview_url',
        'fetched_at',
        'expires_at',
    ];

    protected $casts = [
        'width'      => 'integer',
        'height'     => 'integer',
        'fetched_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
