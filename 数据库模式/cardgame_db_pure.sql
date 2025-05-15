CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE resource_types (
    resource_type_id INT AUTO_INCREMENT PRIMARY KEY,
    resource_name VARCHAR(50) NOT NULL UNIQUE,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE user_resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    resource_type_id INT NOT NULL,
    quantity INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(resource_type_id) ON DELETE CASCADE
);

CREATE TABLE card_pool_types (
    pool_type_id INT AUTO_INCREMENT PRIMARY KEY,
    pool_type_name VARCHAR(50) NOT NULL UNIQUE,
    drop_rates JSON NOT NULL,
    pool_type_description TEXT
);

CREATE TABLE card_pools (
    pool_id INT AUTO_INCREMENT PRIMARY KEY,
    pool_name VARCHAR(50) NOT NULL UNIQUE,
    pool_type_id INT NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    pool_description TEXT,
    FOREIGN KEY (pool_type_id) REFERENCES card_pool_types(pool_type_id) ON DELETE CASCADE
);

CREATE TABLE draw_history (
    draw_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    card_id INT NOT NULL,
    pool_id INT NOT NULL,
    draw_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE,
    FOREIGN KEY (pool_id) REFERENCES card_pools(pool_id) ON DELETE CASCADE
);

CREATE TABLE cards (
    card_id INT AUTO_INCREMENT PRIMARY KEY,
    card_name VARCHAR(100) NOT NULL,
    rarity ENUM('R', 'SR', 'SSR') NOT NULL,
    card_type VARCHAR(50) NOT NULL,
    image_url VARCHAR(255),
    base_stats JSON,
    card_description TEXT
);

CREATE TABLE card_pool_cards (
    pool_card_id INT AUTO_INCREMENT PRIMARY KEY,
    pool_id INT NOT NULL,
    card_id INT NOT NULL,
    FOREIGN KEY (pool_id) REFERENCES card_pools(pool_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE
);

CREATE TABLE card_skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL,
    skill_description TEXT
);

CREATE TABLE card_skill_relation (
    relation_id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NOT NULL,
    skill_id INT NOT NULL,
    skill_values JSON,
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES card_skills(skill_id) ON DELETE CASCADE
);

CREATE TABLE user_cards (
    user_card_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    card_id INT NOT NULL,
    level INT DEFAULT 1,
    acquired_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_stats JSON,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE
);

CREATE TABLE battle_teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    team_name VARCHAR(50) NOT NULL,
    team_description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE team_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_card_id INT NOT NULL,
    slot_position INT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES battle_teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (user_card_id) REFERENCES user_cards(user_card_id) ON DELETE CASCADE,
    UNIQUE (team_id, slot_position)
);

CREATE TABLE dungeons (
    dungeon_id INT AUTO_INCREMENT PRIMARY KEY,
    dungeon_name VARCHAR(100) NOT NULL,
    difficulty ENUM('easy', 'normal', 'hard', 'expert') NOT NULL,
    dungeon_description TEXT
);

CREATE TABLE dungeon_enemies (
    enemy_id INT AUTO_INCREMENT PRIMARY KEY,
    dungeon_id INT NOT NULL,
    enemy_name VARCHAR(100) NOT NULL,
    enemy_level INT NOT NULL,
    is_boss BOOLEAN DEFAULT FALSE,
    enemy_stats JSON,
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(dungeon_id) ON DELETE CASCADE
);

CREATE TABLE enemy_skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL,
    skill_description TEXT
);

CREATE TABLE enemy_skill_relation (
    relation_id INT AUTO_INCREMENT PRIMARY KEY,
    enemy_id INT NOT NULL,
    skill_id INT NOT NULL,
    skill_values JSON,
    FOREIGN KEY (enemy_id) REFERENCES dungeon_enemies(enemy_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES enemy_skills(skill_id) ON DELETE CASCADE
);

CREATE TABLE dungeon_rewards (
    reward_id INT AUTO_INCREMENT PRIMARY KEY,
    dungeon_id INT NOT NULL,
    reward_type INT NOT NULL,
    reward_quantity INT NOT NULL,
    drop_rate FLOAT NOT NULL,
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(dungeon_id) ON DELETE CASCADE,
    FOREIGN KEY (reward_type) REFERENCES resource_types(resource_type_id) ON DELETE CASCADE
);

CREATE TABLE battle_history (
    battle_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    dungeon_id INT NOT NULL,
    team_id INT NOT NULL,
    result ENUM('WIN', 'LOSE') NOT NULL,
    turns_taken INT NOT NULL,
    reward_obtained JSON,
    resurrection_used BOOLEAN DEFAULT FALSE,
    battle_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(dungeon_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES battle_teams(team_id) ON DELETE CASCADE
);

CREATE TABLE payment_records (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    resource_type_id INT NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    resource_quantity INT NOT NULL,
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(resource_type_id) ON DELETE CASCADE
);