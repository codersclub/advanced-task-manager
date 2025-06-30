<?php
define('DB_DRIVER', 'sqlite'); // Варианты: 'sqlite', 'mysql', 'pgsql'

define('DB_CONFIG', [
    'sqlite' => [
        'path' => __DIR__ . '/../database.sqlite'
    ],
    'mysql' => [
        'host' => 'localhost',
        'dbname' => 'task_manager',
        'user' => 'root',
        'pass' => 'password'
    ],
    'pgsql' => [
        'host' => 'localhost',
        'dbname' => 'task_manager',
        'user' => 'postgres',
        'pass' => 'password'
    ]
]);
