docker exec -it database bash
mysql -u root -p
create database antville;
create user 'antville'@'%' identified by 'antville!';
grant all privileges on antville.\* TO 'antville'@'%';
flush privileges;
