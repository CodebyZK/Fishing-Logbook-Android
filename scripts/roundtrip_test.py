from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path


ANDROID_ROOT = Path(__file__).resolve().parent.parent
SERVER_ROOT = ANDROID_ROOT.parent / "Selfhostable-Fishing-Logbook"
sys.path.insert(0, str(SERVER_ROOT))

from backend import logbook_store  # noqa: E402
import server  # noqa: E402


def payload() -> dict:
    return {
        "species": ["Chinook Salmon"],
        "methods": ["Trolling"],
        "lureTypes": ["Spoon"],
        "flasherTypes": ["Paddle"],
        "waterClarities": ["Clear"],
        "weatherTypes": ["Overcast"],
        "reelStyles": ["Baitcaster"],
        "rodTypes": ["Downrigging"],
        "lineTypes": ["Braid"],
        "trollingPresentations": [{"value": "downrigger", "label": "Downrigger"}],
        "trollingDirections": ["N"],
        "setupLineSides": [{"value": "port", "label": "Port"}],
        "lures": [
            {
                "id": "lure-1",
                "name": "Blue Spoon",
                "type": "Spoon",
                "brand": "Test",
                "color": "Blue",
                "notes": "",
            }
        ],
        "flashers": [],
        "reels": [],
        "rods": [],
        "rodReelCombos": [],
        "settings": {
            "timeFormat": "24",
            "units": {
                "depth": "m",
                "distance": "km",
                "speed": "kph",
                "windSpeed": "kph",
                "pressure": "hPa",
                "airTemperature": "C",
                "waterTemperature": "F",
                "precipitation": "mm",
                "waveHeight": "m",
                "fishLength": "in",
                "fishWeight": "lb",
            },
            "chopRanges": [{"id": "calm", "label": "Calm", "maxFeet": None}],
        },
        "people": [{"id": "person-1", "name": "Test Angler"}],
        "locations": [
            {
                "id": "loc-1",
                "name": "Lake Ontario",
                "coordinates": {"latitude": 43.2, "longitude": -79.5},
                "launches": [
                    {
                        "id": "launch-1",
                        "name": "Test Launch",
                        "coordinates": {"latitude": 43.21, "longitude": -79.51},
                    }
                ],
            }
        ],
        "trips": [
            {
                "id": "trip-1",
                "title": "Mobile round trip",
                "date": "2026-06-19",
                "location": "Lake Ontario",
                "locationId": "loc-1",
                "launch": "Test Launch",
                "launchId": "launch-1",
                "startTime": "06:00",
                "endTime": "10:00",
                "hours": 4,
                "targetSpecies": "Chinook Salmon",
                "method": "Trolling",
                "intent": "Test API compatibility",
                "tripRating": "5",
                "waterTemp": "48",
                "waterClarity": "Clear",
                "weather": "Overcast",
                "waveHeight": "0.5",
                "waveChop": "Calm",
                "wind": "W 10 kph",
                "structure": "30 m",
                "notes": "Round-trip fixture",
                "notePhotos": [],
                "people": [{"id": "person-1", "name": "Test Angler"}],
                "gearUsed": [
                    {
                        "id": "setup-1",
                        "personId": "person-1",
                        "startTime": "06:15",
                        "endTime": "09:45",
                        "changeNote": "",
                        "side": "port",
                        "lineLabel": "Port rigger",
                        "comboId": "",
                        "rodId": "",
                        "reelId": "",
                        "lureId": "lure-1",
                        "flasherId": "",
                        "presentation": "downrigger",
                        "deepestRigger": True,
                        "lureMinutes": 210,
                        "flasherMinutes": 0,
                    }
                ],
                "catches": [
                    {
                        "id": "catch-1",
                        "personId": "person-1",
                        "species": "Chinook Salmon",
                        "released": True,
                        "length": "34",
                        "weight": "18",
                        "time": "07:10",
                        "waterDepth": "30",
                        "depthDown": "18",
                        "presentation": "downrigger",
                        "direction": "N",
                        "fowCaught": "30",
                        "speed": "4.2",
                        "retrieve": "",
                        "ballDepth": "18",
                        "lineBehindBoard": "",
                        "estimatedLureDepth": "",
                        "dipseySetting": "",
                        "lineOut": "",
                        "estimatedDepth": "",
                        "notes": "Mobile catch",
                        "setupLineId": "setup-1",
                        "lureId": "lure-1",
                        "flasherId": "",
                        "manualCoordinates": {"latitude": 43.25, "longitude": -79.55},
                        "coordinates": {"latitude": 43.25, "longitude": -79.55},
                        "photos": [],
                        "mobileExtension": {"preserved": True},
                    }
                ],
                "lostFish": [
                    {
                        "id": "lost-1",
                        "personId": "person-1",
                        "possibleSpecies": "Chinook Salmon",
                        "released": False,
                        "time": "08:00",
                        "waterDepth": "32",
                        "depthDown": "20",
                        "presentation": "downrigger",
                        "direction": "N",
                        "fowCaught": "32",
                        "speed": "4.1",
                        "retrieve": "",
                        "ballDepth": "20",
                        "lineBehindBoard": "",
                        "estimatedLureDepth": "",
                        "dipseySetting": "",
                        "lineOut": "",
                        "estimatedDepth": "",
                        "notes": "",
                        "setupLineId": "setup-1",
                        "lureId": "lure-1",
                        "flasherId": "",
                    }
                ],
                "unknownTripField": "preserve-me",
            }
        ],
        "mobileDocumentExtension": {"version": 1},
    }


def main() -> None:
    original_data_dir = logbook_store.DATA_DIR
    original_data_file = logbook_store.DATA_FILE
    with tempfile.TemporaryDirectory(prefix="fishing-logbook-roundtrip-") as temp:
        data_dir = Path(temp)
        logbook_store.DATA_DIR = data_dir
        logbook_store.DATA_FILE = data_dir / "logbook.json"
        try:
            app = server.create_app()
            app.testing = True
            client = app.test_client()

            put_response = client.put("/api/logbook", json=payload())
            assert put_response.status_code == 200, put_response.get_data(as_text=True)

            get_response = client.get("/api/logbook")
            assert get_response.status_code == 200
            result = get_response.get_json()

            trip = result["trips"][0]
            catch = trip["catches"][0]
            assert trip["gearUsed"][0]["id"] == "setup-1"
            assert catch["setupLineId"] == "setup-1"
            assert catch["manualCoordinates"] == {"latitude": 43.25, "longitude": -79.55}
            assert catch["mobileExtension"] == {"preserved": True}
            assert trip["unknownTripField"] == "preserve-me"
            assert result["mobileDocumentExtension"] == {"version": 1}
            assert trip["locationId"] == "loc-1"
            assert trip["launchId"] == "launch-1"

            persisted = json.loads(logbook_store.DATA_FILE.read_text(encoding="utf-8"))
            assert persisted == result
            print("Round-trip passed: mobile document survived Flask PUT/GET normalization.")
        finally:
            logbook_store.DATA_DIR = original_data_dir
            logbook_store.DATA_FILE = original_data_file


if __name__ == "__main__":
    main()
