<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response;

class KitchenDisplayController extends Controller
{
    public function index(): Response
    {
        $orders = Order::with(['items.menu', 'tableSession.table'])
            ->whereIn('status', ['paid', 'processing'])
            ->orderBy('created_at', 'asc')
            ->get();

        return Inertia::render('kitchen/Index', [
            'orders' => $orders,
        ]);
    }
}
