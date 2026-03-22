<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page'      => 'sometimes|integer|min:1',
            'admin_id'  => 'sometimes|integer',
            'action'    => 'sometimes|string',
            'date_from' => 'sometimes|date_format:Y-m-d',
            'date_to'   => 'sometimes|date_format:Y-m-d',
        ]);

        $query = AdminAuditLog::with([
                'adminUser:id,name',
                'impersonatingClient:id,name',
            ])
            ->orderByDesc('created_at');

        if ($request->filled('admin_id')) {
            $query->where('admin_user_id', $request->integer('admin_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $paginated = $query->paginate(50);

        $admins = User::where('role', 'admin')->get(['id', 'name']);

        return response()->json([
            'data'         => $paginated->items(),
            'total'        => $paginated->total(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'per_page'     => $paginated->perPage(),
            'admins'       => $admins,
        ]);
    }
}
