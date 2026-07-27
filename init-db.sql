CREATE DATABASE IF NOT EXISTS waste_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS central_core_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON waste_management.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON central_core_db.* TO 'root'@'%';
FLUSH PRIVILEGES;
