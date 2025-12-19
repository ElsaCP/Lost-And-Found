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
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:@127.0.0.1:3306/lostfound?charset=utf8mb4"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SECRET_KEY = "supersecretkey123"
    SIGN_SECRET = "lostfound-juanda-aman"
    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = "juandalostfound@gmail.com"
    MAIL_PASSWORD = "hjycmxzwduzdbxlj"  
    MAIL_DEFAULT_SENDER = ("Lost & Found Juanda", "juandalostfound@gmail.com")

    ADMIN_EMAIL = "juandalostfound@gmail.com"
