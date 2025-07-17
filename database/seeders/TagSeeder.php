<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tag;
use Illuminate\Support\Str;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            'JavaScript',
            'PHP',
            'Python',
            'React',
            'Vue.js',
            'Laravel',
            'Node.js',
            'TypeScript',
            'CSS',
            'HTML',
            'Bootstrap',
            'Tailwind CSS',
            'MySQL',
            'PostgreSQL',
            'MongoDB',
            'Redis',
            'Docker',
            'Kubernetes',
            'AWS',
            'Google Cloud',
            'Azure',
            'Git',
            'GitHub',
            'GitLab',
            'API',
            'REST',
            'GraphQL',
            'Microservices',
            'Testing',
            'TDD',
            'Agile',
            'Scrum',
            'SEO',
            'Analytics',
            'Social Media',
            'Content Marketing',
            'Email Marketing',
            'PPC',
            'Conversion Optimization',
            'Figma',
            'Adobe XD',
            'Sketch',
            'Wireframing',
            'Prototyping',
            'User Research',
            'A/B Testing',
            'Machine Learning',
            'AI',
            'Data Visualization',
            'Big Data',
            'Blockchain',
            'Cryptocurrency',
            'IoT',
            'AR/VR',
            'Mobile Apps',
            'iOS',
            'Android',
            'Flutter',
            'React Native',
            'Swift',
            'Kotlin',
            'Security',
            'Privacy',
            'GDPR',
            'Encryption',
            'Penetration Testing',
            'Remote Work',
            'Freelancing',
            'Startup',
            'Leadership',
            'Management',
        ];

        foreach ($tags as $tagName) {
            Tag::create([
                'name' => $tagName,
                'slug' => Str::slug($tagName),
            ]);
        }
    }
}
