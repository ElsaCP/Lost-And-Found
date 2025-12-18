# app.py
from flask import Flask
from config import Config
from extensions import db, mail
from routes.route import main
from routes.admin_route import admin_bp

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
mail.init_app(app)   # ✅ INIT MAIL DI SINI

with app.app_context():
    db.create_all()

app.register_blueprint(main)
app.register_blueprint(admin_bp, url_prefix="/admin")
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
