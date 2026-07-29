<?php

namespace App\Http\Requests\Pos;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmPayRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:order_items,id',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.option_ids' => 'nullable|array',
            'items.*.option_ids.*' => 'exists:option_items,id',
            'payment_method' => 'required|in:cash,qris,debit,credit',
            'discount_type' => 'nullable|in:percentage,nominal',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_approved_by' => 'nullable|exists:users,id',
        ];
    }
}
