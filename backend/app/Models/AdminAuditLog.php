<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminAuditLog extends Model
{
    protected $table = 'admin_audit_log';

    protected $fillable = [
        'admin_user_id',
        'impersonating_client_id',
        'action',
        'metadata',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    public function impersonatingClient(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'impersonating_client_id');
    }
}
