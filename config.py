# config.py
import mysql.connector
from mysql.connector import Error

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",      # sesuaikan
        password="",      # sesuaikan
        database="lostfound",
        charset='utf8mb4'
    )
