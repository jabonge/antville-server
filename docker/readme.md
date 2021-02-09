docker exec -it docker_db_1 bash
mysql -u root -p
create database valuetalk;
create user 'valuetalk'@'%' identified by 'valueTalk!';
grant all privileges on valuetalk.* TO 'valuetalk'@'%';
flush privileges;