create database pxldb;
\c pxldb

create user secadv with password 'ilovesecurity';
grant all privileges on database pxldb to secadv;
BEGIN;

create table users (id serial primary key, user_name text not null unique, password text not null);
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO secadv;
grant all privileges on table users to secadv;

COMMIT;
