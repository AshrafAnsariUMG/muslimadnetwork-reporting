<?php

namespace App\Services;

use App\Models\ClientDisplayName;

class DisplayNameService
{
    /**
     * Apply display name rules to an array of rows.
     *
     * Fetches all matching rules in one query, applies client-specific override
     * first, then falls back to global rule. Returns original key if no rule.
     *
     * @param  array  $rows          Array of associative arrays
     * @param  string $section       'domain' or 'app'
     * @param  string $keyField      The field name containing the original key (e.g. 'domain', 'app')
     * @param  int|null $clientId    The client ID for client-specific overrides
     * @return array  Rows with display names applied
     */
    public function applyToRows(array $rows, string $section, string $keyField, ?int $clientId): array
    {
        if (empty($rows)) {
            return $rows;
        }

        // Fetch all rules for this section that are global OR for this client — one query
        $rules = ClientDisplayName::where('section', $section)
            ->where(function ($q) use ($clientId) {
                $q->whereNull('client_id');
                if ($clientId) {
                    $q->orWhere('client_id', $clientId);
                }
            })
            ->get(['client_id', 'original_key', 'display_name']);

        if ($rules->isEmpty()) {
            return $rows;
        }

        // Build lookup: original_key => [global => name, client => name]
        $lookup = [];
        foreach ($rules as $rule) {
            $key = $rule->original_key;
            if ($rule->client_id === null) {
                $lookup[$key]['global'] = $rule->display_name;
            } else {
                $lookup[$key]['client'] = $rule->display_name;
            }
        }

        return array_map(function (array $row) use ($lookup, $keyField) {
            $original = $row[$keyField] ?? '';
            if (isset($lookup[$original])) {
                // Client-specific override takes precedence over global
                $row[$keyField] = $lookup[$original]['client'] ?? $lookup[$original]['global'] ?? $original;
            }
            return $row;
        }, $rows);
    }

    /**
     * Resolve a single display name for a given key.
     */
    public function resolve(string $originalKey, string $section, ?int $clientId): string
    {
        $rules = ClientDisplayName::where('section', $section)
            ->where('original_key', $originalKey)
            ->where(function ($q) use ($clientId) {
                $q->whereNull('client_id');
                if ($clientId) {
                    $q->orWhere('client_id', $clientId);
                }
            })
            ->get(['client_id', 'display_name']);

        $global = null;
        $client = null;

        foreach ($rules as $rule) {
            if ($rule->client_id === null) {
                $global = $rule->display_name;
            } else {
                $client = $rule->display_name;
            }
        }

        return $client ?? $global ?? $originalKey;
    }
}
