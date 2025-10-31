<?php
// ChimeraAI - PHP Project Template
// Project: {{PROJECT_NAME}}

// Error Reporting (Development)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Project Configuration
define('PROJECT_NAME', '{{PROJECT_NAME}}');
define('SERVER', '{{SERVER}}');
define('PORT', {{PORT}});
define('DOMAIN', '{{DOMAIN}}');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo PROJECT_NAME; ?> - PHP App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🐘 <?php echo PROJECT_NAME; ?></h1>
            <p class="subtitle">PHP Application powered by ChimeraAI</p>
        </header>
        
        <main>
            <section class="card">
                <h2>✅ PHP is Working!</h2>
                <p>Your PHP environment is configured correctly.</p>
                
                <div class="info-grid">
                    <div class="info-item">
                        <strong>PHP Version:</strong>
                        <span><?php echo phpversion(); ?></span>
                    </div>
                    <div class="info-item">
                        <strong>Server:</strong>
                        <span><?php echo SERVER; ?></span>
                    </div>
                    <div class="info-item">
                        <strong>Port:</strong>
                        <span><?php echo PORT; ?></span>
                    </div>
                    <div class="info-item">
                        <strong>Domain:</strong>
                        <span><a href="http://<?php echo DOMAIN; ?>" target="_blank"><?php echo DOMAIN; ?></a></span>
                    </div>
                </div>
            </section>
            
            <section class="card">
                <h2>📁 Project Structure</h2>
                <ul>
                    <li><code>index.php</code> - Main entry point</li>
                    <li><code>style.css</code> - Stylesheet</li>
                    <li><code>.htaccess</code> - Apache configuration</li>
                    <li><code>.chimera</code> - Project settings (optional)</li>
                </ul>
            </section>
            
            <section class="card">
                <h2>🚀 Next Steps</h2>
                <ol>
                    <li>Edit <code>index.php</code> to build your application</li>
                    <li>Create additional PHP files as needed</li>
                    <li>Connect to a database (MySQL/MariaDB)</li>
                    <li>Use <code>.htaccess</code> for URL rewriting</li>
                </ol>
            </section>
            
            <section class="card">
                <h2>📊 Server Information</h2>
                <div class="server-info">
                    <p><strong>Current Time:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
                    <p><strong>Server Software:</strong> <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></p>
                    <p><strong>Document Root:</strong> <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
                </div>
            </section>
        </main>
        
        <footer>
            <p>Created with ❤️ by <strong>ChimeraAI</strong></p>
            <p class="small">PHP <?php echo phpversion(); ?> • <?php echo SERVER; ?></p>
        </footer>
    </div>
</body>
</html>
