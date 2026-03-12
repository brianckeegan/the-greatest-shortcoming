---
layout: post
title: Notebooks & Data
description: Jupyter notebooks and datasets used in the research
image: assets/images/pic04.jpg
nav-menu: true
---

## Overview

This page links to the Jupyter notebooks and datasets underlying the computational analyses in *The Greatest Shortcoming*. All code is written in Python and is made available under an open-source license. Notebooks can be run interactively via Binder or downloaded from GitHub.

Where possible, datasets are archived on Zenodo to ensure long-term availability with citable DOIs.

---

## Notebooks

| Notebook | Chapter | Description | Links |
|----------|---------|-------------|-------|
| `01_lecture_corpus.ipynb` | Ch. 2 | Assembles and cleans the corpus of Bartlett lecture transcripts across versions (1969–2013) | [GitHub](#) · [Binder](#) |
| `02_text_preprocessing.ipynb` | Ch. 2 | Tokenization, lemmatization, and stop-word removal for the lecture corpus | [GitHub](#) · [Binder](#) |
| `03_topic_modeling.ipynb` | Ch. 2 | Latent Dirichlet Allocation (LDA) topic models of lecture transcript versions | [GitHub](#) · [Binder](#) |
| `04_rhetorical_analysis.ipynb` | Ch. 2 | Keyword-in-context (KWIC) analysis of key terms; sentiment analysis | [GitHub](#) · [Binder](#) |
| `05_citation_network.ipynb` | Ch. 3 | Constructs and visualizes Bartlett's citation and co-citation network | [GitHub](#) · [Binder](#) |
| `06_organization_network.ipynb` | Ch. 3 | Maps organizational affiliations and funding networks of neo-Malthusian groups | [GitHub](#) · [Binder](#) |
| `07_boulder_housing.ipynb` | Ch. 4–5 | Analysis of Boulder housing costs, vacancy rates, and affordability trends (1970–2020) | [GitHub](#) · [Binder](#) |
| `08_demographic_analysis.ipynb` | Ch. 5 | Demographic change analysis using Census and ACS data; displacement indicators | [GitHub](#) · [Binder](#) |
| `09_comparative_cities.ipynb` | Ch. 5 | Comparative analysis of housing costs and density across peer cities | [GitHub](#) · [Binder](#) |

---

## Datasets

| Dataset | Description | Source | Archive |
|---------|-------------|--------|---------|
| `bartlett_lectures.csv` | Transcripts of Bartlett's lecture across documented versions | Manual transcription from video recordings and print sources | [Zenodo](#) |
| `bartlett_bibliography.csv` | Complete bibliography of Bartlett's publications and public statements | CU Boulder Archives; Web of Science | [Zenodo](#) |
| `fair_documents.csv` | Corpus of policy documents from FAIR, NumbersUSA, and related organizations (1979–2015) | Internet Archive | [Zenodo](#) |
| `boulder_zoning.geojson` | Boulder city zoning boundaries, historical and current | City of Boulder Open Data | [Zenodo](#) |
| `boulder_housing_costs.csv` | Annual median home prices and rents in Boulder County (1970–2023) | FRED, Zillow Research Data | [Zenodo](#) |
| `acs_boulder_demographics.csv` | American Community Survey demographic data for Boulder city and county | U.S. Census Bureau | [Zenodo](#) |
| `co_city_comparisons.csv` | Housing cost and demographic data for Colorado Front Range cities | HUD, Census Bureau | [Zenodo](#) |

---

## Getting Started

All notebooks require Python 3.9+ and the following core packages: `pandas`, `numpy`, `matplotlib`, `seaborn`, `nltk`, `gensim`, `scikit-learn`, `networkx`, and `geopandas`.

Install dependencies with:

```bash
pip install -r requirements.txt
```

Or launch directly in Binder (no installation required): **[Launch Binder](#)**

The full repository, including notebooks, data, and environment specification, is available on GitHub: **[brianckeegan/the-greatest-shortcoming](#)**
