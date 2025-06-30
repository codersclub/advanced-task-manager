<?php

require_once 'config.php';

function getDBConnection() {
    try {
        switch (DB_DRIVER) {
            case 'sqlite':
                $dsn = "sqlite:" . DB_CONFIG['sqlite']['path'];
                $pdo = new PDO($dsn);
                // Для SQLite включаем поддержку внешних ключей (foreign keys)
                $pdo->exec("PRAGMA foreign_keys = ON;");
                break;
                
            case 'mysql':
                $cfg = DB_CONFIG['mysql'];
                $dsn = "mysql:host={$cfg['host']};dbname={$cfg['dbname']};charset=utf8mb4";
                $pdo = new PDO($dsn, $cfg['user'], $cfg['pass']);
                break;
                
            case 'pgsql':
                $cfg = DB_CONFIG['pgsql'];
                $dsn = "pgsql:host={$cfg['host']};dbname={$cfg['dbname']}";
                $pdo = new PDO($dsn, $cfg['user'], $cfg['pass']);
                break;
                
            default:
                throw new Exception("Неизвестный драйвер БД");
        }
        
        // Включаем режим выброса исключений при ошибках в SQL
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        // Возвращаем данные в виде ассоциативных массивов по умолчанию
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        return $pdo;
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Ошибка подключения к БД: " . $e->getMessage()]);
        exit;
    }
}
