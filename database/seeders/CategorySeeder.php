<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Web Development',
                'description' => 'Articles about web development, frameworks, and best practices.',
            ],
            [
                'name' => 'Mobile Development',
                'description' => 'iOS, Android, and cross-platform mobile development tutorials.',
            ],
            [
                'name' => 'Digital Marketing',
                'description' => 'SEO, social media marketing, and digital advertising strategies.',
            ],
            [
                'name' => 'UI/UX Design',
                'description' => 'User interface and user experience design principles and trends.',
            ],
            [
                'name' => 'DevOps',
                'description' => 'Deployment, CI/CD, cloud services, and infrastructure management.',
            ],
            [
                'name' => 'Data Science',
                'description' => 'Machine learning, data analysis, and artificial intelligence.',
            ],
            [
                'name' => 'Cybersecurity',
                'description' => 'Security best practices, threat analysis, and protection strategies.',
            ],
            [
                'name' => 'Productivity',
                'description' => 'Tools, tips, and techniques to boost productivity and efficiency.',
            ],
            [
                'name' => 'Career',
                'description' => 'Career advice, job hunting tips, and professional development.',
            ],
            [
                'name' => 'Technology News',
                'description' => 'Latest technology trends, news, and industry updates.',
            ],
        ];

        foreach ($categories as $category) {
            Category::create([
                'name' => $category['name'],
                'slug' => Str::slug($category['name']),
                'description' => $category['description'],
            ]);
        }
    }
}
