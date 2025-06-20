from flask import Flask, render_template, request, jsonify
import requests
from bs4 import BeautifulSoup
import re
import tensorflow as tf
import tf_keras as keras
import tensorflow_hub as hub
import tensorflow_text as text
from spacy.lang.en import English
import os




nlp = English() # setup English sentence parser
nlp.add_pipe("sentencizer") # add sentence splitting pipeline object to sentence parser


def split_chars(text):
  return " ".join(list(text))

def preprocess_text_with_line_numbers(abstract_lines):
    # get total number of lines
    total_lines_in_sample = len(abstract_lines)
    # Go through each line in abstract and create a list of dictionaries containing features for each line
    sample_lines = []

    for i, line in enumerate(abstract_lines):
        sample_dict = {}
        sample_dict["text"] = line
        sample_dict["line_number"] = i
        sample_dict["total_lines"] = total_lines_in_sample
        sample_lines.append(sample_dict)
    return sample_lines

def skimit(abstract_lines, model):
  class_names = ['BACKGROUND', 'CONCLUSIONS', 'METHODS', 'OBJECTIVE', 'RESULTS']
  # Go through each line in abstract and create a list of dictionaries containing features for each line
  sample_lines = preprocess_text_with_line_numbers(abstract_lines)

  test_abstract_line_numbers = [line["line_number"] for line in sample_lines]
  # One-hot encode to same depth as training data, so model accepts right input shape
  test_abstract_line_numbers_one_hot = tf.one_hot(test_abstract_line_numbers, depth=15)

  # Get all total_lines values from sample abstract
  test_abstract_total_lines = [line["total_lines"] for line in sample_lines]
  # One-hot encode to same depth as training data, so model accepts right input shape
  test_abstract_total_lines_one_hot = tf.one_hot(test_abstract_total_lines, depth=20)

  # Split abstract lines into characters
  abstract_chars = [split_chars(sentence) for sentence in abstract_lines]

  # Make predictions on sample abstract features
  test_abstract_pred_probs = model.predict(x=(test_abstract_line_numbers_one_hot,
                                                   test_abstract_total_lines_one_hot,
                                                   tf.constant(abstract_lines),
                                                   tf.constant(abstract_chars)
                                                  ))
  test_abstract_preds = tf.argmax(test_abstract_pred_probs, axis=1)
  test_abstract_pred_classes = [class_names[i] for i in test_abstract_preds]

  skimmed_abstract = {}

  for i, line in enumerate(abstract_lines):
    label = test_abstract_pred_classes[i]
    if label in skimmed_abstract:
            # Append to existing list
        if isinstance(skimmed_abstract[label], list):
             skimmed_abstract[label].append(line)
        else:
            # Convert string to list (first duplicate)
            skimmed_abstract[label] = [skimmed_abstract[label], line]
    else:
        # First time: store as string
         skimmed_abstract[label] = line
    
    order_based_result = {}
    for key, value in enumerate(skimmed_abstract.items()):
        order_based_result[key] = value

  return order_based_result

app = Flask(__name__)

print(os.listdir("model/"))
model = keras.models.load_model("model/PubMed", custom_objects={"KerasLayer": hub.KerasLayer})

# Scrape abstract from PubMed link
def scrape_from_link(link):
    response = requests.get(link)
    html_data = response.text
    data = BeautifulSoup(html_data, "html.parser")
    abstract = data.find_all(class_="abstract-content selected")
    return abstract[0].p.text.strip() if abstract and abstract[0].p else ""

# PubMed link regex
PUBMED_REGEX = re.compile(r"^https?://pubmed\.ncbi\.nlm\.nih\.gov/\d+/?$")

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    text = ''
    pubmed_link = request.form.get('pubmed_link', '').strip()
    if pubmed_link:
        if not PUBMED_REGEX.match(pubmed_link):
            return jsonify({'error': 'Only valid PubMed links are accepted.'}), 400
        try:
            text = scrape_from_link(pubmed_link)
        except Exception as e:
            return jsonify({'error': f'Failed to scrape PubMed abstract: {str(e)}'}), 400
        if not text:
            return jsonify({'error': 'No abstract found at the provided PubMed link.'}), 400
    elif 'abstract_text' in request.form and request.form['abstract_text'].strip():
        text = request.form['abstract_text']
    elif 'file' in request.files:
        file = request.files['file']
        if file and file.filename.endswith('.txt'):
            text = file.read().decode('utf-8')
        else:
            return jsonify({'error': 'Only .txt files are supported.'}), 400
    else:
        return jsonify({'error': 'No input provided.'}), 400
    # For now, return a fixed output
    doc = nlp(text) # create "doc" of parsed sequences, change index for different abstract
    abstract_lines = [str(sent) for sent in list(doc.sents)]
    output = skimit(abstract_lines, model)
    return jsonify(output)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
