<?php

namespace App\Http\Requests\Pos;

use Illuminate\Foundation\Http\FormRequest;

class InitiatePaymentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'table_id' => 'nullable|exists:tables,id',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.option_ids' => 'nullable|array',
            'items.*.option_ids.*' => 'exists:option_items,id',
            'payment_type' => 'required|string|max:50',
            'discount_type' => 'nullable|in:percentage,nominal',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_approved_by' => 'nullable|exists:users,id',
            'order_type' => 'nullable|in:dine_in,takeaway',
            'customer_name' => 'nullable|string|max:255',
        ];
    }
}
