from flask import Blueprint, render_template
from .data_download import hardcoded_temperature

bp = Blueprint('routes', __name__)

@bp.route('/')
def index():
    return render_template('index.html')