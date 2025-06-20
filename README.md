# PubMedSimplify

**PubMedSimplify** is a modern, full-stack web application that enables users to easily summarize and structure PubMed abstracts using a state-of-the-art deep learning model. The app is designed for medical researchers, clinicians, and students who want to quickly extract key information from scientific literature.

---

## 🚀 Project Overview

PubMedSimplify leverages a custom multimodal neural network, built on top of BERT embeddings trained on PubMed sentences, to classify each sentence in a medical abstract into its semantic section (e.g., Background, Methods, Results, Conclusions, Objective). The web interface allows users to paste, upload, or link PubMed abstracts and receive a structured, easy-to-read summary.

---

## ✨ Features

- **Paste, upload, or link PubMed abstracts** for instant summarization.
- **Drag-and-drop** support for `.txt` files.
- **Structured output**: Each sentence is classified into sections (Background, Methods, Results, Conclusions, Objective).
- **Modern, responsive UI** with dark/light mode, animated transitions, and floating cards.
- **Real-time progress and typing effects** for a smooth user experience.
- **Recent abstracts gallery** (optional).
- **Backend powered by Flask and TensorFlow/Keras**.
- **Advanced data pipelines** and training callbacks for robust model performance.

---

## 🧠 Model Architecture

The core of PubMedSimplify is a **multimodal neural network** inspired by [Dernoncourt et al., 2017 (PubMed 200k RCT)](https://arxiv.org/pdf/1710.06071). The model combines token, character, and positional embeddings for robust sequential sentence classification.

### Model Components

1. **Token Inputs (BERT Embeddings)**

   - Input: Raw sentence strings.
   - Preprocessing: Custom preprocessing layer.
   - Embedding: PubMed-trained BERT model (`bert_layer`).
   - Output: 128-dimensional dense layer.

2. **Character Inputs**

   - Input: Sentence as a string.
   - Vectorization: Character-level vectorizer and embedding.
   - Sequence Modeling: Bidirectional LSTM (32 units).
   - Output: Character-level sentence representation.

3. **Line Number Inputs**

   - Input: One-hot encoded line number (shape: 15).
   - Output: 32-dimensional dense layer.

4. **Total Lines Inputs**

   - Input: One-hot encoded total lines (shape: 20).
   - Output: 32-dimensional dense layer.

5. **Hybrid Embedding**

   - Concatenate token and character embeddings.
   - Dense layer (256 units, ReLU) + Dropout (0.5).

6. **Tribrid Embedding**

   - Concatenate hybrid embedding with positional embeddings (line number, total lines).

7. **Output Layer**

   - Dense layer with 5 units (softmax) for section classification.

8. **Model Assembly**
   - All inputs and outputs are combined into a single Keras model.

#### Model Code (Summary)

```python
# Token input branch
token_inputs = layers.Input(shape=[], dtype="string", name="token_inputs")
preprocessed_inputs = preprocessing_layer(token_inputs)
bert_token_embeddings = bert_layer(preprocessed_inputs)["pooled_output"]
token_outputs = layers.Dense(128, activation="relu")(bert_token_embeddings)
token_model = tf.keras.Model(inputs=token_inputs, outputs=token_outputs)

# Char input branch
char_inputs = layers.Input(shape=(1,), dtype="string", name="char_inputs")
char_vectors = char_vectorizer(char_inputs)
char_embeddings = char_embed(char_vectors)
char_bi_lstm = layers.Bidirectional(layers.LSTM(32))(char_embeddings)
char_model = tf.keras.Model(inputs=char_inputs, outputs=char_bi_lstm)

# Line number branch
line_number_inputs = layers.Input(shape=(15,), dtype=tf.float32, name="line_number_input")
x = layers.Dense(32, activation="relu")(line_number_inputs)
line_number_model = tf.keras.Model(inputs=line_number_inputs, outputs=x)

# Total lines branch
total_lines_inputs = layers.Input(shape=(20,), dtype=tf.float32, name="total_lines_input")
y = layers.Dense(32, activation="relu")(total_lines_inputs)
total_lines_model = tf.keras.Model(inputs=total_lines_inputs, outputs=y)

# Combine embeddings
combined_embeddings = layers.Concatenate(name="token_char_hybrid_embedding")([token_model.output, char_model.output])
z = layers.Dense(256, activation="relu")(combined_embeddings)
z = layers.Dropout(0.5)(z)
z = layers.Concatenate(name="token_char_positional_embedding")([line_number_model.output, total_lines_model.output, z])

# Output
output_layer = layers.Dense(5, activation="softmax", name="output_layer")(z)

# Final model
model = tf.keras.Model(
    inputs=[line_number_model.input, total_lines_model.input, token_model.input, char_model.input],
    outputs=output_layer
)
```

---

## 🏋️ Training Details

- **Dataset**: PubMed 200k RCT (2.3M sentences, 200k abstracts) [[arXiv:1710.06071](https://arxiv.org/pdf/1710.06071)]
- **Mixed precision training** for speed and efficiency.
- **Advanced data pipelines** for efficient preprocessing and batching.
- **Callbacks**:
  - `ModelCheckpoint` for best model saving.
  - `EarlyStopping` to prevent overfitting.
  - `ReduceLROnPlateau` for dynamic learning rate adjustment.
- **Achieved ~90% accuracy** on the test set.

---

## 📊 Data & Model Sources

**Where our data is coming from:**  
We use the [PubMed 200k RCT dataset](https://github.com/Franck-Dernoncourt/pubmed-rct), specifically the 20k subset, which is a large, publicly available dataset for sequential sentence classification in medical abstracts. This dataset consists of thousands of PubMed abstracts, each sentence labeled as background, objective, method, result, or conclusion.

- Dataset paper: [PubMed 200k RCT: a Dataset for Sequential Sentence Classification in Medical Abstracts](https://arxiv.org/pdf/1710.06071)

**Where our model is coming from:**  
Our model architecture is inspired by the work in  
[Neural networks for joint sentence classification in medical paper abstracts](https://arxiv.org/pdf/1612.05251) (Dernoncourt et al., 2017), which explores deep learning approaches for classifying sentences in medical abstracts.

- Model paper: [Neural networks for joint sentence classification in medical paper abstracts](https://arxiv.org/pdf/1612.05251)

**Dataset repository:**

- [https://github.com/Franck-Dernoncourt/pubmed-rct](https://github.com/Franck-Dernoncourt/pubmed-rct)

---

## 🖥️ Tech Stack

- **Frontend**: HTML, Tailwind CSS, JavaScript (with modern UX features)
- **Backend**: Python, Flask, TensorFlow/Keras, TensorFlow Hub
- **Deployment**: Easily run locally or deploy to any WSGI-compatible server

---

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Anand-Velpuri/PubMedSimplify.git
   cd PubMedSimplify
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Run the app**
   ```bash
   python app.py
   ```
   Visit [http://localhost:5000](http://localhost:5000) in your browser.

---

## 📚 References

- Dernoncourt, F., Lee, J. Y., & Szolovits, P. (2017). [PubMed 200k RCT: a Dataset for Sequential Sentence Classification in Medical Abstracts](https://arxiv.org/pdf/1710.06071). _arXiv preprint arXiv:1710.06071_.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/Anand-Velpuri/PubMedSimplify/issues).

---

## 📝 License

This project is licensed under the MIT License.

---

Let me know if you want to add badges, screenshots, or further details!
