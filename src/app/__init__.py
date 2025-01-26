# src/app/__init__.py
from flask import Flask

def create_app():
    app = Flask(__name__)
    # Register blueprints or routes here
    from .routes import bp as routes_bp
    from .temperature import temperature_bp  # Import the new blueprint
    app.register_blueprint(routes_bp)
    app.register_blueprint(temperature_bp)  # Register the new blueprint

    return app

# filepath: /Users/jimruppert/Projects/ClimateChroma/src/app/routes.py
from flask import Blueprint, render_template


bp = Blueprint('routes', __name__)

@bp.route('/')
def index():
    return render_template('index.html')
