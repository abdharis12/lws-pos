<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class MenuOptionGroup extends Pivot
{
    protected $table = 'menu_option_group';

    public $incrementing = true;

    protected $fillable = ['menu_id', 'option_group_id'];

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function optionGroup(): BelongsTo
    {
        return $this->belongsTo(OptionGroup::class);
    }
}
