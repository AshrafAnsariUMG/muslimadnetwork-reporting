<?php

namespace App\Models;

use App\Enums\CampaignStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Campaign extends Model
{
    protected $fillable = [
        'client_id',
        'cm360_campaign_id',
        'name',
        'status',
        'start_date',
        'contracted_impressions',
        'contracted_clicks',
        'is_primary',
        'has_conversion_tracking',
        'cm360_activity_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => CampaignStatus::class,
            'start_date' => 'date',
            'is_primary' => 'boolean',
            'has_conversion_tracking' => 'boolean',
            'contracted_impressions' => 'integer',
            'contracted_clicks' => 'integer',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
