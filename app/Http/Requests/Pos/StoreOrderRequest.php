<?php

namespace App\Http\Requests\Pos;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'table_id' => 'nullable|exists:tables,id',
            'table_ids' => 'nullable|array',
            'table_ids.*' => 'exists:tables,id',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.option_ids' => 'nullable|array',
            'items.*.option_ids.*' => 'exists:option_items,id',
            'payment_method' => 'nullable|in:cash,qris,debit,credit',
            'discount_type' => 'nullable|in:percentage,nominal',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_approved_by' => 'nullable|exists:users,id',
            'split_count' => 'nullable|integer|min:1|max:20',
            'order_type' => 'nullable|in:dine_in,takeaway',
            'customer_name' => 'nullable|string|max:255',
        ];
    }
}
