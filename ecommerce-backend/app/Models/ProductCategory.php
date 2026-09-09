<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'description',
        'image',
        'is_active',
    ];

    public function parentCategory()
    {
        return $this->belongsTo(ProductCategory::class, 'parent_id');
    }

    public function childCategories()
    {
        return $this->hasMany(ProductCategory::class, 'parent_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
