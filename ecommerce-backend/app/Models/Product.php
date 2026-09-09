<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'product_category_id',
        'name',
        'slug',
        'description',
        'price',
        'discount_price',
        'stock_quantity',
        'is_active',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function productCategory()
    {
        return $this->belongsTo(ProductCategory::class);
    }
}
