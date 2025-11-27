# config.py
import mysql.connector
from mysql.connector import Error
import os

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="lostfound",
        charset='utf8mb4'
    )

class Config:
    # Gunakan database yang kamu pakai (lostfound atau inj_db)
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:@127.0.0.1:3306/lostfound?charset=utf8mb4"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = "supersecretkey123"
