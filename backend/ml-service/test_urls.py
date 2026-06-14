import requests

urls = {
    "T-Shirt": "https://upload.wikimedia.org/wikipedia/commons/2/24/Blue_Tshirt.png",
    "iPhone": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/IPhone_X_vector.svg/512px-IPhone_X_vector.svg.png",
    "Headphones": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Headphones_1.png/512px-Headphones_1.png",
    "Jacket": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/White_jacket.png/512px-White_jacket.png"
}

for k, v in urls.items():
    print(f"{k}: {requests.head(v).status_code}")
