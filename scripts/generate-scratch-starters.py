"""Generate small, original Scratch 3 projects without accounts or external assets.

Run: python scripts/generate-scratch-starters.py
Outputs are tracked .sb3 ZIP files under the website's public directory.
The original SVG art and block scripts are part of this project's source.
"""

import hashlib
import json
from pathlib import Path
import zipfile

OUTPUT = Path(__file__).resolve().parents[1] / "artifacts/mind-matters/public/coding-starters"


class Code:
    def __init__(self):
        self.blocks = {}

    def add(self, opcode, *, inputs=None, fields=None, top=False, shadow=False, x=40, y=40):
        block_id = f"block-{len(self.blocks)}"
        self.blocks[block_id] = {
            "opcode": opcode, "next": None, "parent": None,
            "inputs": inputs or {}, "fields": fields or {},
            "shadow": shadow, "topLevel": top,
        }
        if top:
            self.blocks[block_id].update(x=x, y=y)
        return block_id

    def chain(self, *ids):
        for parent, child in zip(ids, ids[1:]):
            self.blocks[parent]["next"] = child
            self.blocks[child]["parent"] = parent

    def attach(self, parent, name, child):
        self.blocks[parent]["inputs"][name] = [2, child]
        self.blocks[child]["parent"] = parent


def number(value):
    return [1, [4, str(value)]]


def text(value):
    return [1, [10, value]]


def costume(name, svg, center):
    raw = svg.encode("utf-8")
    asset_id = hashlib.md5(raw).hexdigest()
    return {
        "assetId": asset_id, "name": name, "bitmapResolution": 1,
        "md5ext": f"{asset_id}.svg", "dataFormat": "svg",
        "rotationCenterX": center[0], "rotationCenterY": center[1],
    }, raw


BACKGROUND = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><rect width="480" height="360" fill="#faf4e8"/><rect x="8" y="8" width="464" height="344" rx="20" fill="none" stroke="#d4c8ad" stroke-width="2"/></svg>'
PLAYER = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M4 4 44 24 4 44 12 24Z" fill="#527548" stroke="#304e2d" stroke-width="2"/></svg>'
BALL = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="#cf633e" stroke="#9b4025" stroke-width="3"/><circle cx="22" cy="20" r="6" fill="#ffe4c2"/></svg>'


def star(color):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="m24 3 6 14 15 2-11 10 3 15-13-8-13 8 3-15L3 19l15-2Z" fill="{color}" stroke="#82572d" stroke-width="2"/></svg>'


def target(name, code, costumes, *, stage=False, x=0, y=0):
    result = {
        "isStage": stage, "name": name, "variables": {}, "lists": {}, "broadcasts": {},
        "blocks": code.blocks, "comments": {}, "currentCostume": 0,
        "costumes": costumes, "sounds": [], "volume": 100, "layerOrder": 0 if stage else 1,
    }
    if stage:
        result.update(tempo=60, videoTransparency=50, videoState="off", textToSpeechLanguage=None)
    else:
        result.update(visible=True, x=x, y=y, size=100, direction=90, draggable=False, rotationStyle="don't rotate")
    return result


def base(scoring=True):
    code = Code()
    if scoring:
        flag = code.add("event_whenflagclicked", top=True)
        reset = code.add("data_setvariableto", inputs={"VALUE": number(0)}, fields={"VARIABLE": ["Score", "score"]})
        code.chain(flag, reset)
    background, asset = costume("Playground", BACKGROUND, (240, 180))
    stage = target("Stage", code, [background], stage=True)
    monitors = []
    if scoring:
        stage["variables"] = {"score": ["Score", 0]}
        monitors = [{
            "id": "score", "mode": "default", "opcode": "data_variable", "params": {"VARIABLE": "Score"},
            "spriteName": None, "value": 0, "width": 0, "height": 0, "x": 15, "y": 15,
            "visible": True, "sliderMin": 0, "sliderMax": 100, "isDiscrete": True,
        }]
    project = {
        "targets": [stage], "monitors": monitors, "extensions": [],
        "meta": {"semver": "3.0.0", "vm": "0.2.0", "agent": "Mind Matters classroom starter"},
    }
    return project, {background["md5ext"]: asset}


def add_sprite(project, assets, name, code, art, x=0, y=0):
    costumes = []
    for label, svg, center in art:
        item, raw = costume(label, svg, center)
        costumes.append(item)
        assets[item["md5ext"]] = raw
    sprite = target(name, code, costumes, x=x, y=y)
    sprite["layerOrder"] = len(project["targets"])
    project["targets"].append(sprite)


def chase():
    project, assets = base()
    player = Code()
    flag = player.add("event_whenflagclicked", top=True)
    home = player.add("motion_gotoxy", inputs={"X": number(-120), "Y": number(0)})
    player.chain(flag, home)
    for i, (key, opcode, amount) in enumerate([
        ("right arrow", "motion_changexby", 10), ("left arrow", "motion_changexby", -10),
        ("up arrow", "motion_changeyby", 10), ("down arrow", "motion_changeyby", -10),
    ]):
        event = player.add("event_whenkeypressed", fields={"KEY_OPTION": [key, None]}, top=True, x=40 + (i % 2) * 250, y=180 + (i // 2) * 150)
        move = player.add(opcode, inputs={"DX" if "changex" in opcode else "DY": number(amount)})
        player.chain(event, move)
    add_sprite(project, assets, "Player", player, [("Player", PLAYER, (24, 24))], -120, 0)

    code = Code()
    flag = code.add("event_whenflagclicked", top=True)
    home = code.add("motion_gotoxy", inputs={"X": number(120), "Y": number(0)})
    loop = code.add("control_forever")
    check = code.add("control_if")
    touching = code.add("sensing_touchingobject")
    menu = code.add("sensing_touchingobjectmenu", fields={"TOUCHINGOBJECTMENU": ["Player", None]}, shadow=True)
    # Dropdown menus are shadow inputs; reporters and substacks are real blocks.
    code.blocks[touching]["inputs"]["TOUCHINGOBJECTMENU"] = [1, menu]
    code.blocks[menu]["parent"] = touching
    score = code.add("data_changevariableby", inputs={"VALUE": number(1)}, fields={"VARIABLE": ["Score", "score"]})
    move = code.add("motion_gotoxy")
    random_x = code.add("operator_random", inputs={"FROM": number(-200), "TO": number(200)})
    random_y = code.add("operator_random", inputs={"FROM": number(-140), "TO": number(140)})
    wait = code.add("control_wait", inputs={"DURATION": number(0.15)})
    code.chain(flag, home, loop)
    code.attach(loop, "SUBSTACK", check)
    code.attach(check, "CONDITION", touching)
    code.attach(check, "SUBSTACK", score)
    code.chain(score, move, wait)
    code.attach(move, "X", random_x)
    code.attach(move, "Y", random_y)
    add_sprite(project, assets, "Star", code, [("Star", star("#e4b251"), (24, 24))], 120, 0)
    return project, assets


def bounce():
    project, assets = base(scoring=False)
    code = Code()
    flag = code.add("event_whenflagclicked", top=True)
    home = code.add("motion_gotoxy", inputs={"X": number(0), "Y": number(0)})
    direction = code.add("motion_pointindirection", inputs={"DIRECTION": number(45)})
    loop = code.add("control_forever")
    move = code.add("motion_movesteps", inputs={"STEPS": number(5)})
    edge = code.add("motion_ifonedgebounce")
    wait = code.add("control_wait", inputs={"DURATION": number(0.02)})
    code.chain(flag, home, direction, loop)
    code.attach(loop, "SUBSTACK", move)
    code.chain(move, edge, wait)
    add_sprite(project, assets, "Ball", code, [("Ball", BALL, (30, 30))])
    return project, assets


def counter():
    project, assets = base()
    code = Code()
    flag = code.add("event_whenflagclicked", top=True)
    greet = code.add("looks_say", inputs={"MESSAGE": text("Click me to earn points!")})
    code.chain(flag, greet)
    click = code.add("event_whenthisspriteclicked", top=True, x=40, y=220)
    score = code.add("data_changevariableby", inputs={"VALUE": number(1)}, fields={"VARIABLE": ["Score", "score"]})
    color = code.add("looks_nextcostume")
    code.chain(click, score, color)
    add_sprite(project, assets, "Star", code, [
        ("Gold star", star("#e4b251"), (24, 24)),
        ("Rose star", star("#d89f9f"), (24, 24)),
        ("Green star", star("#93af7e"), (24, 24)),
    ])
    return project, assets


def validate(project, assets):
    for sprite in project["targets"]:
        blocks = sprite["blocks"]
        for block_id, block in blocks.items():
            for field in ("next", "parent"):
                ref = block[field]
                assert ref is None or ref in blocks, (block_id, field, ref)
            for value in block["inputs"].values():
                for ref in value[1:]:
                    if isinstance(ref, str):
                        assert ref in blocks, (block_id, ref)
            if block["next"]:
                assert blocks[block["next"]]["parent"] == block_id
        for item in sprite["costumes"]:
            assert item["md5ext"] in assets
            assert hashlib.md5(assets[item["md5ext"]]).hexdigest() == item["assetId"]
    assert not project["extensions"]
    assert all(not variable[2:] for sprite in project["targets"] for variable in sprite["variables"].values())


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, build in [("chase-the-star", chase), ("bouncing-ball", bounce), ("click-counter", counter)]:
        project, assets = build()
        validate(project, assets)
        path = OUTPUT / f"{name}.sb3"
        with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            entries = {"project.json": json.dumps(project, separators=(",", ":")).encode(), **assets}
            for filename, content in sorted(entries.items()):
                # Stable timestamps keep regeneration reproducible.
                info = zipfile.ZipInfo(filename, date_time=(2026, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(info, content)
        with zipfile.ZipFile(path) as archive:
            assert archive.testzip() is None
            assert json.loads(archive.read("project.json"))["meta"]["semver"] == "3.0.0"
        print(f"{path.relative_to(OUTPUT.parent)}: {path.stat().st_size} bytes, validated")


if __name__ == "__main__":
    main()
