<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Post;
use App\Models\User;
use App\Models\Category;
use App\Models\Tag;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PostSeeder extends Seeder
{
    public function run(): void
    {
        $authors = User::whereIn('role', ['admin', 'author'])->get();
        $categories = Category::all();
        $tags = Tag::all();

        $posts = [
            [
                'title' => 'Getting Started with Laravel 11: A Complete Guide',
                'excerpt' => 'Learn how to build modern web applications with Laravel 11. This comprehensive guide covers installation, routing, controllers, and more.',
                'content' => $this->getLaravelContent(),
                'status' => 'published',
                'featured_image' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
                'categories' => ['Web Development'],
                'tags' => ['Laravel', 'PHP', 'Web Development', 'Framework'],
            ],
            [
                'title' => 'React Hooks: Mastering useState and useEffect',
                'excerpt' => 'Deep dive into React Hooks and learn how to manage state and side effects in functional components effectively.',
                'content' => $this->getReactContent(),
                'status' => 'published',
                'featured_image' => 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
                'categories' => ['Web Development'],
                'tags' => ['React', 'JavaScript', 'Hooks', 'Frontend'],
            ],
            [
                'title' => 'SEO Best Practices for 2024',
                'excerpt' => 'Stay ahead of the competition with these essential SEO strategies and techniques that will boost your search rankings.',
                'content' => $this->getSEOContent(),
                'status' => 'published',
                'featured_image' => 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=400&fit=crop',
                'categories' => ['Digital Marketing'],
                'tags' => ['SEO', 'Marketing', 'Google', 'Content Marketing'],
            ],
            [
                'title' => 'Design Systems: Building Consistent User Interfaces',
                'excerpt' => 'Learn how to create and maintain design systems that ensure consistency across your digital products.',
                'content' => $this->getDesignSystemContent(),
                'status' => 'published',
                'featured_image' => 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=400&fit=crop',
                'categories' => ['UI/UX Design'],
                'tags' => ['Design Systems', 'UI/UX', 'Figma', 'Design'],
            ],
            [
                'title' => 'Docker for Developers: Containerization Made Easy',
                'excerpt' => 'Master Docker containerization and learn how to streamline your development workflow with containers.',
                'content' => $this->getDockerContent(),
                'status' => 'published',
                'featured_image' => 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&h=400&fit=crop',
                'categories' => ['DevOps'],
                'tags' => ['Docker', 'DevOps', 'Containerization', 'Development'],
            ],
            [
                'title' => 'Machine Learning Fundamentals for Beginners',
                'excerpt' => 'Start your journey into machine learning with this beginner-friendly introduction to key concepts and algorithms.',
                'content' => $this->getMLContent(),
                'status' => 'published',
                'featured_image' => 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop',
                'categories' => ['Data Science'],
                'tags' => ['Machine Learning', 'AI', 'Python', 'Data Science'],
            ],
            [
                'title' => 'Cybersecurity Essentials for Small Businesses',
                'excerpt' => 'Protect your business from cyber threats with these essential security practices and tools.',
                'content' => $this->getCybersecurityContent(),
                'status' => 'published',
                'featured_image' => 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop',
                'categories' => ['Cybersecurity'],
                'tags' => ['Security', 'Cybersecurity', 'Business', 'Privacy'],
            ],
            [
                'title' => 'Productivity Hacks for Remote Developers',
                'excerpt' => 'Boost your productivity while working from home with these proven strategies and tools.',
                'content' => $this->getProductivityContent(),
                'status' => 'published',
                'featured_image' => 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop',
                'categories' => ['Productivity'],
                'tags' => ['Productivity', 'Remote Work', 'Tools', 'Efficiency'],
            ],
            [
                'title' => 'Building Your Tech Career: From Junior to Senior',
                'excerpt' => 'Navigate your tech career path with practical advice on skill development, networking, and career advancement.',
                'content' => $this->getCareerContent(),
                'status' => 'published',
                'featured_image' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
                'categories' => ['Career'],
                'tags' => ['Career', 'Professional Development', 'Tech Industry', 'Growth'],
            ],
            [
                'title' => 'The Future of Web Development: Trends to Watch',
                'excerpt' => 'Explore the latest trends and technologies shaping the future of web development.',
                'content' => $this->getTrendsContent(),
                'status' => 'published',
                'featured_image' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
                'categories' => ['Technology News'],
                'tags' => ['Web Development', 'Trends', 'Technology', 'Future'],
            ],
            // Draft posts
            [
                'title' => 'Advanced TypeScript Patterns',
                'excerpt' => 'Explore advanced TypeScript patterns and techniques for building robust applications.',
                'content' => $this->getTypeScriptContent(),
                'status' => 'draft',
                'featured_image' => 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop',
                'categories' => ['Web Development'],
                'tags' => ['TypeScript', 'JavaScript', 'Programming', 'Advanced'],
            ],
            [
                'title' => 'Mobile App Performance Optimization',
                'excerpt' => 'Learn how to optimize your mobile applications for better performance and user experience.',
                'content' => $this->getMobileContent(),
                'status' => 'draft',
                'featured_image' => 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop',
                'categories' => ['Mobile Development'],
                'tags' => ['Mobile', 'Performance', 'Optimization', 'Apps'],
            ],
        ];

        foreach ($posts as $postData) {
            $author = $authors->random();
            $publishedAt = $postData['status'] === 'published'
                ? Carbon::now()->subDays(rand(1, 90))
                : null;

            $post = Post::create([
                'title' => $postData['title'],
                'slug' => Str::slug($postData['title']),
                'content' => $postData['content'],
                'excerpt' => $postData['excerpt'],
                'author_id' => $author->id,
                'featured_image' => $postData['featured_image'],
                'status' => $postData['status'],
                'published_at' => $publishedAt,
                'views' => $postData['status'] === 'published' ? rand(50, 1000) : 0,
                'meta_title' => $postData['title'],
                'meta_description' => $postData['excerpt'],
                'meta_keywords' => implode(', ', $postData['tags']),
            ]);

            // Attach categories
            $postCategories = $categories->whereIn('name', $postData['categories']);
            $post->categories()->attach($postCategories->pluck('id'));

            // Attach tags
            $postTags = $tags->whereIn('name', $postData['tags']);
            $post->tags()->attach($postTags->pluck('id'));
        }
    }

    private function getLaravelContent(): string
    {
        return '<h2>Introduction to Laravel</h2>
        <p>Laravel is a powerful PHP framework that makes web development enjoyable and creative. In this comprehensive guide, we\'ll explore the fundamentals of Laravel 11 and build a complete application from scratch.</p>
        
        <h3>Installation</h3>
        <p>Getting started with Laravel is straightforward. You can install Laravel using Composer:</p>
        <pre><code>composer create-project laravel/laravel my-app</code></pre>
        
        <h3>Routing</h3>
        <p>Laravel\'s routing system is elegant and expressive. Here\'s how you define routes:</p>
        <pre><code>Route::get(\'/\', function () {
    return view(\'welcome\');
});</code></pre>
        
        <h3>Controllers</h3>
        <p>Controllers help organize your application logic. Create a controller using Artisan:</p>
        <pre><code>php artisan make:controller UserController</code></pre>
        
        <p>Laravel continues to evolve, and version 11 brings exciting new features that make development even more efficient.</p>';
    }

    private function getReactContent(): string
    {
        return '<h2>Understanding React Hooks</h2>
        <p>React Hooks revolutionized how we write React components by allowing us to use state and other React features in functional components.</p>
        
        <h3>useState Hook</h3>
        <p>The useState hook lets you add state to functional components:</p>
        <pre><code>const [count, setCount] = useState(0);</code></pre>
        
        <h3>useEffect Hook</h3>
        <p>useEffect handles side effects in your components:</p>
        <pre><code>useEffect(() => {
    document.title = `Count: ${count}`;
}, [count]);</code></pre>
        
        <h3>Best Practices</h3>
        <ul>
        <li>Always include dependencies in useEffect</li>
        <li>Use multiple useEffect hooks for different concerns</li>
        <li>Clean up subscriptions and timers</li>
        </ul>
        
        <p>Mastering these hooks will significantly improve your React development skills.</p>';
    }

    private function getSEOContent(): string
    {
        return '<h2>SEO Strategies for 2024</h2>
        <p>Search engine optimization continues to evolve. Here are the most important strategies to focus on this year.</p>
        
        <h3>Core Web Vitals</h3>
        <p>Google\'s Core Web Vitals are crucial ranking factors:</p>
        <ul>
        <li>Largest Contentful Paint (LCP)</li>
        <li>First Input Delay (FID)</li>
        <li>Cumulative Layout Shift (CLS)</li>
        </ul>
        
        <h3>Content Quality</h3>
        <p>High-quality, relevant content remains the foundation of good SEO. Focus on:</p>
        <ul>
        <li>User intent and search queries</li>
        <li>Comprehensive topic coverage</li>
        <li>Regular content updates</li>
        </ul>
        
        <h3>Technical SEO</h3>
        <p>Technical aspects that matter:</p>
        <ul>
        <li>Mobile-first indexing</li>
        <li>Page speed optimization</li>
        <li>Structured data markup</li>
        <li>XML sitemaps</li>
        </ul>
        
        <p>Implementing these strategies will help improve your search rankings and organic traffic.</p>';
    }

    private function getDesignSystemContent(): string
    {
        return '<h2>Building Effective Design Systems</h2>
        <p>A design system is a collection of reusable components, guided by clear standards, that can be assembled to build applications.</p>
        
        <h3>Components of a Design System</h3>
        <ul>
        <li>Design tokens (colors, typography, spacing)</li>
        <li>UI components (buttons, forms, cards)</li>
        <li>Patterns and templates</li>
        <li>Documentation and guidelines</li>
        </ul>
        
        <h3>Benefits</h3>
        <p>Design systems provide numerous advantages:</p>
        <ul>
        <li>Consistency across products</li>
        <li>Faster development cycles</li>
        <li>Better collaboration between teams</li>
        <li>Easier maintenance and updates</li>
        </ul>
        
        <h3>Implementation Tips</h3>
        <p>Start small and grow your design system organically. Focus on the most commonly used components first, and always involve both designers and developers in the process.</p>';
    }

    private function getDockerContent(): string
    {
        return '<h2>Docker Fundamentals</h2>
        <p>Docker revolutionizes how we develop, ship, and run applications by using containerization technology.</p>
        
        <h3>What is Docker?</h3>
        <p>Docker is a platform that uses OS-level virtualization to deliver software in packages called containers.</p>
        
        <h3>Key Concepts</h3>
        <ul>
        <li><strong>Images:</strong> Read-only templates used to create containers</li>
        <li><strong>Containers:</strong> Running instances of Docker images</li>
        <li><strong>Dockerfile:</strong> Text file with instructions to build images</li>
        <li><strong>Docker Compose:</strong> Tool for defining multi-container applications</li>
        </ul>
        
        <h3>Basic Commands</h3>
        <pre><code># Build an image
docker build -t my-app .

# Run a container
docker run -p 3000:3000 my-app

# List running containers
docker ps</code></pre>
        
        <p>Docker simplifies deployment and ensures consistency across different environments.</p>';
    }

    private function getMLContent(): string
    {
        return '<h2>Machine Learning Basics</h2>
        <p>Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data.</p>
        
        <h3>Types of Machine Learning</h3>
        <ul>
        <li><strong>Supervised Learning:</strong> Learning with labeled data</li>
        <li><strong>Unsupervised Learning:</strong> Finding patterns in unlabeled data</li>
        <li><strong>Reinforcement Learning:</strong> Learning through interaction and feedback</li>
        </ul>
        
        <h3>Common Algorithms</h3>
        <ul>
        <li>Linear Regression</li>
        <li>Decision Trees</li>
        <li>Random Forest</li>
        <li>Neural Networks</li>
        </ul>
        
        <h3>Getting Started</h3>
        <p>Begin your ML journey with Python and these libraries:</p>
        <ul>
        <li>NumPy for numerical computing</li>
        <li>Pandas for data manipulation</li>
        <li>Scikit-learn for machine learning</li>
        <li>Matplotlib for visualization</li>
        </ul>
        
        <p>Start with simple projects and gradually work your way up to more complex problems.</p>';
    }

    private function getCybersecurityContent(): string
    {
        return '<h2>Cybersecurity for Small Businesses</h2>
        <p>Small businesses are increasingly targeted by cybercriminals. Here\'s how to protect your organization.</p>
        
        <h3>Common Threats</h3>
        <ul>
        <li>Phishing attacks</li>
        <li>Ransomware</li>
        <li>Data breaches</li>
        <li>Social engineering</li>
        </ul>
        
        <h3>Essential Security Measures</h3>
        <ul>
        <li>Use strong, unique passwords</li>
        <li>Enable two-factor authentication</li>
        <li>Keep software updated</li>
        <li>Regular data backups</li>
        <li>Employee security training</li>
        </ul>
        
        <h3>Security Tools</h3>
        <p>Invest in these essential security tools:</p>
        <ul>
        <li>Antivirus software</li>
        <li>Firewall protection</li>
        <li>VPN for remote access</li>
        <li>Email security solutions</li>
        </ul>
        
        <p>Remember, cybersecurity is an ongoing process, not a one-time setup.</p>';
    }

    private function getProductivityContent(): string
    {
        return '<h2>Remote Developer Productivity</h2>
        <p>Working from home presents unique challenges. Here are proven strategies to stay productive as a remote developer.</p>
        
        <h3>Workspace Setup</h3>
        <ul>
        <li>Dedicated workspace</li>
        <li>Ergonomic furniture</li>
        <li>Good lighting</li>
        <li>Minimal distractions</li>
        </ul>
        
        <h3>Time Management</h3>
        <ul>
        <li>Use the Pomodoro Technique</li>
        <li>Time blocking for deep work</li>
        <li>Regular breaks</li>
        <li>Clear boundaries between work and personal time</li>
        </ul>
        
        <h3>Essential Tools</h3>
        <ul>
        <li>Project management: Trello, Asana</li>
        <li>Communication: Slack, Discord</li>
        <li>Code collaboration: GitHub, GitLab</li>
        <li>Time tracking: Toggl, RescueTime</li>
        </ul>
        
        <p>Consistency and discipline are key to maintaining productivity while working remotely.</p>';
    }

    private function getCareerContent(): string
    {
        return '<h2>Advancing Your Tech Career</h2>
        <p>Building a successful career in technology requires strategic planning and continuous learning.</p>
        
        <h3>Skill Development</h3>
        <ul>
        <li>Master the fundamentals</li>
        <li>Stay current with industry trends</li>
        <li>Learn complementary skills</li>
        <li>Practice problem-solving</li>
        </ul>
        
        <h3>Building Your Network</h3>
        <ul>
        <li>Attend tech meetups and conferences</li>
        <li>Contribute to open source projects</li>
        <li>Engage on professional social media</li>
        <li>Find mentors and mentees</li>
        </ul>
        
        <h3>Career Progression</h3>
        <p>Typical progression path:</p>
        <ol>
        <li>Junior Developer</li>
        <li>Mid-level Developer</li>
        <li>Senior Developer</li>
        <li>Tech Lead / Architect</li>
        <li>Engineering Manager</li>
        </ol>
        
        <p>Focus on both technical skills and soft skills like communication and leadership.</p>';
    }

    private function getTrendsContent(): string
    {
        return '<h2>Web Development Trends 2024</h2>
        <p>The web development landscape continues to evolve rapidly. Here are the key trends shaping the industry.</p>
        
        <h3>Frontend Trends</h3>
        <ul>
        <li>Server-side rendering (SSR) and static site generation</li>
        <li>Micro-frontends architecture</li>
        <li>WebAssembly adoption</li>
        <li>Progressive Web Apps (PWAs)</li>
        </ul>
        
        <h3>Backend Trends</h3>
        <ul>
        <li>Serverless computing</li>
        <li>GraphQL APIs</li>
        <li>Microservices architecture</li>
        <li>Edge computing</li>
        </ul>
        
        <h3>Development Practices</h3>
        <ul>
        <li>DevOps and CI/CD</li>
        <li>Test-driven development</li>
        <li>API-first development</li>
        <li>Low-code/no-code platforms</li>
        </ul>
        
        <p>Staying informed about these trends will help you make better technology choices and advance your career.</p>';
    }

    private function getTypeScriptContent(): string
    {
        return '<h2>Advanced TypeScript Patterns</h2>
        <p>TypeScript offers powerful features for building robust applications. Let\'s explore advanced patterns and techniques.</p>
        
        <h3>Generic Types</h3>
        <p>Generics provide type safety while maintaining flexibility:</p>
        <pre><code>function identity<T>(arg: T): T {
    return arg;
}</code></pre>
        
        <h3>Utility Types</h3>
        <p>TypeScript includes built-in utility types:</p>
        <ul>
        <li>Partial&lt;T&gt;</li>
        <li>Required&lt;T&gt;</li>
        <li>Pick&lt;T, K&gt;</li>
        <li>Omit&lt;T, K&gt;</li>
        </ul>
        
        <p>These patterns help create more maintainable and type-safe code.</p>';
    }

    private function getMobileContent(): string
    {
        return '<h2>Mobile App Performance</h2>
        <p>Optimizing mobile app performance is crucial for user experience and retention.</p>
        
        <h3>Key Performance Metrics</h3>
        <ul>
        <li>App launch time</li>
        <li>Memory usage</li>
        <li>Battery consumption</li>
        <li>Network efficiency</li>
        </ul>
        
        <h3>Optimization Techniques</h3>
        <ul>
        <li>Image optimization</li>
        <li>Code splitting</li>
        <li>Lazy loading</li>
        <li>Caching strategies</li>
        </ul>
        
        <p>Regular performance testing and monitoring are essential for maintaining optimal app performance.</p>';
    }
}
