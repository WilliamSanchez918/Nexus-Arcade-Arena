extends Node3D

const GAME_ID := "nexus_relay"
const GAME_TITLE := "Nexus Overdrive"
const JOIN_COUNTDOWN_SECONDS := 12.0
const ATTRACT_DEMO_SECONDS := 8.0
const BRIEFING_SECONDS := 2.8
const INTERMISSION_SECONDS := 2.4
const THREAT_GRACE_SECONDS := 10.0
const MAX_TIME_SECONDS := 260.0
const PLAYER_SPEED := 7.4
const PLAYER_ACCELERATION := 26.0
const PLAYER_DECELERATION := 34.0
const PLAYER_RADIUS := 0.55
const PLAYER_INTERACT_RADIUS := 1.55
const PLAYER_WEAPON_COOLDOWN := 0.42
const PLAYER_WEAPON_RANGE := 8.6
const PLAYER_WEAPON_SPEED := 28.0
const PLAYER_WEAPON_DAMAGE := 34.0
const PLAYER_WEAPON_RADIUS := 0.11
const PHYSICS_PROP_RADIUS := 0.48
const PHYSICS_PROP_FRICTION := 5.8
const SENTRY_ALERT_RADIUS := 4.9
const SENTRY_PATROL_RADIUS := 1.65
const SENTRY_HEALTH := 100.0
const SENTRY_ATTACK_RANGE := 0.96
const SENTRY_ATTACK_COOLDOWN := 1.15
const SENTRY_STUN_DURATION := 0.42
const SPAWN_SAFE_RADIUS := 7.2
const ARENA_RECT := Rect2(Vector2(-12.0, -7.0), Vector2(24.0, 14.0))
const MISSION_NAMES := ["Generate Sparks", "Frame The Route", "Share The Prototype"]
const MISSION_STORY := [
	{
		"title": "Generate Sparks",
		"solo": "Collect idea sparks in the open lanes before blockers enter the sprint.",
		"coop": "Split the lanes, call out sparks, and keep the center clear.",
		"hint": "Move first. Threats wait during safe launch."
	},
	{
		"title": "Frame The Route",
		"solo": "Tag the Always and Never gates to turn the raw sparks into a route.",
		"coop": "Either player can tag a gate; cover the route while your partner crosses.",
		"hint": "Clear success: both gates lit."
	},
	{
		"title": "Share The Prototype",
		"solo": "Hold the demo pad long enough to ship the prototype.",
		"coop": "All active players hold the demo pad together for a stronger finish.",
		"hint": "Hold the bright pad. Beat your score next run."
	}
]
const ASSET_ROOT := "res://assets/kenney"
const PBR_ROOT := "res://assets/ambientcg"
const MODULE_ROOT := ASSET_ROOT + "/modular-space-kit/models"
const KENNEY_CHARACTER_ROOT := ASSET_ROOT + "/animated-characters-protagonists"
const QUATERNIUS_ROOT := "res://assets/quaternius/ultimate-space-kit/models"
const KENNEY_CHARACTER_MODEL := KENNEY_CHARACTER_ROOT + "/Model/characterMedium.fbx"
const KENNEY_CHARACTER_ANIMATIONS := {
	"idle": KENNEY_CHARACTER_ROOT + "/Animations/idle.fbx",
	"run": KENNEY_CHARACTER_ROOT + "/Animations/run.fbx",
	"jump": KENNEY_CHARACTER_ROOT + "/Animations/jump.fbx"
}
const KENNEY_CHARACTER_SKINS := {
	"cyborg": KENNEY_CHARACTER_ROOT + "/Skins/cyborgFemaleA.png",
	"criminal": KENNEY_CHARACTER_ROOT + "/Skins/criminalMaleA.png",
	"skater_female": KENNEY_CHARACTER_ROOT + "/Skins/skaterFemaleA.png",
	"skater_male": KENNEY_CHARACTER_ROOT + "/Skins/skaterMaleA.png"
}
const MODULE_MODEL_PATHS := {
	"room_small": MODULE_ROOT + "/room-small.glb",
	"room_wide": MODULE_ROOT + "/room-wide.glb",
	"corridor": MODULE_ROOT + "/corridor.glb",
	"corridor_corner": MODULE_ROOT + "/corridor-corner.glb",
	"corridor_wide": MODULE_ROOT + "/corridor-wide.glb",
	"gate": MODULE_ROOT + "/gate.glb",
	"gate_lasers": MODULE_ROOT + "/gate-lasers.glb",
	"cables": MODULE_ROOT + "/cables.glb",
	"stairs": MODULE_ROOT + "/stairs.glb",
	"floor_big": MODULE_ROOT + "/template-floor-big.glb"
}
const QUATERNIUS_MODEL_PATHS := {
	"astronaut": QUATERNIUS_ROOT + "/Astronaut.glb",
	"mech": QUATERNIUS_ROOT + "/Mech.glb",
	"enemy_flying": QUATERNIUS_ROOT + "/Enemy Flying.glb",
	"enemy_small": QUATERNIUS_ROOT + "/Enemy Small.glb",
	"pickup_crate": QUATERNIUS_ROOT + "/Pickup Crate.glb",
	"pickup_key_card": QUATERNIUS_ROOT + "/Pickup Key Card.glb",
	"pickup_sphere": QUATERNIUS_ROOT + "/Pickup Sphere.glb",
	"pickup_thunder": QUATERNIUS_ROOT + "/Pickup Thunder.glb",
	"round_rover": QUATERNIUS_ROOT + "/Round Rover.glb",
	"rover": QUATERNIUS_ROOT + "/Rover.glb",
	"base_large": QUATERNIUS_ROOT + "/Base Large.glb",
	"building_l": QUATERNIUS_ROOT + "/Building L.glb",
	"connector": QUATERNIUS_ROOT + "/Connector.glb",
	"geodesic_dome": QUATERNIUS_ROOT + "/Geodesic Dome.glb",
	"metal_support": QUATERNIUS_ROOT + "/Metal Support.glb",
	"ramp": QUATERNIUS_ROOT + "/Ramp.glb",
	"solar_panel": QUATERNIUS_ROOT + "/Solar Panel.glb",
	"roof_radar": QUATERNIUS_ROOT + "/Roof Radar.glb",
	"spaceship": QUATERNIUS_ROOT + "/Spaceship.glb"
}
const PBR_TEXTURE_SETS := {
	"floor_panel_2k": {
		"color": PBR_ROOT + "/MetalPlates006_2K/MetalPlates006_2K-JPG_Color.jpg",
		"normal": PBR_ROOT + "/MetalPlates006_2K/MetalPlates006_2K-JPG_NormalGL.jpg",
		"roughness": PBR_ROOT + "/MetalPlates006_2K/MetalPlates006_2K-JPG_Roughness.jpg",
		"metallic": PBR_ROOT + "/MetalPlates006_2K/MetalPlates006_2K-JPG_Metalness.jpg"
	},
	"diamond_floor": {
		"color": PBR_ROOT + "/DiamondPlate005D/DiamondPlate005D_1K-JPG_Color.jpg",
		"normal": PBR_ROOT + "/DiamondPlate005D/DiamondPlate005D_1K-JPG_NormalGL.jpg",
		"roughness": PBR_ROOT + "/DiamondPlate005D/DiamondPlate005D_1K-JPG_Roughness.jpg",
		"metallic": PBR_ROOT + "/DiamondPlate005D/DiamondPlate005D_1K-JPG_Metalness.jpg",
		"ao": PBR_ROOT + "/DiamondPlate005D/DiamondPlate005D_1K-JPG_AmbientOcclusion.jpg"
	},
	"panel_metal": {
		"color": PBR_ROOT + "/MetalPlates006/MetalPlates006_1K-JPG_Color.jpg",
		"normal": PBR_ROOT + "/MetalPlates006/MetalPlates006_1K-JPG_NormalGL.jpg",
		"roughness": PBR_ROOT + "/MetalPlates006/MetalPlates006_1K-JPG_Roughness.jpg",
		"metallic": PBR_ROOT + "/MetalPlates006/MetalPlates006_1K-JPG_Metalness.jpg"
	},
	"smooth_metal": {
		"color": PBR_ROOT + "/Metal031/Metal031_1K-JPG_Color.jpg",
		"normal": PBR_ROOT + "/Metal031/Metal031_1K-JPG_NormalGL.jpg",
		"roughness": PBR_ROOT + "/Metal031/Metal031_1K-JPG_Roughness.jpg",
		"metallic": PBR_ROOT + "/Metal031/Metal031_1K-JPG_Metalness.jpg"
	}
}
const SOUND_PATHS := {
	"click": ASSET_ROOT + "/interface-sounds/click_001.ogg",
	"select": ASSET_ROOT + "/interface-sounds/select_001.ogg",
	"confirm": ASSET_ROOT + "/interface-sounds/confirmation_001.ogg",
	"error": ASSET_ROOT + "/interface-sounds/error_001.ogg",
	"switch": ASSET_ROOT + "/interface-sounds/switch_001.ogg",
	"glitch": ASSET_ROOT + "/interface-sounds/glitch_001.ogg",
	"drop": ASSET_ROOT + "/interface-sounds/drop_001.ogg"
}
const MUSIC_PATHS := {
	"arena": "res://assets/music/tomality/spinner_loop_1.ogg",
	"finish": "res://assets/music/tomality/overtime_loop_2.ogg"
}

var launch_payload: Dictionary = {}
var payload_by_slot := {}
var callback_url := ""
var callback_secret := ""
var started_at_iso := ""
var phase := "attract"
var join_remaining := JOIN_COUNTDOWN_SECONDS
var threat_grace_remaining := 0.0
var scene_timer := 0.0
var attract_demo_time := 0.0
var elapsed_seconds := 0.0
var generation_seed := 0
var rng := RandomNumberGenerator.new()

var players: Array[Dictionary] = []
var player_stats := {
	"P1": { "score": 0, "objectives": 0, "assists": 0, "pickups": 0, "damageTaken": 0, "mobDefeats": 0 },
	"P2": { "score": 0, "objectives": 0, "assists": 0, "pickups": 0, "damageTaken": 0, "mobDefeats": 0 }
}
var active_player_count := 1

var mission_index := 0
var mission_status := "Waiting for operators."
var team_score := 0
var finished := false
var submitted_result := false
var final_message := ""

var relay_pads: Array[Dictionary] = []
var relay_progress := [0.0, 0.0]
var sync_progress := 0.0
var sync_required := 4.0
var data_cores: Array[Dictionary] = []
var supply_caches: Array[Dictionary] = []
var hazards: Array[Dictionary] = []
var sentries: Array[Dictionary] = []
var physics_props: Array[Dictionary] = []
var projectiles: Array[Dictionary] = []
var fx_events: Array[Dictionary] = []
var drone := {}

var materials := {}
var texture_cache := {}
var audio_players := {}
var music_player: AudioStreamPlayer

var world_root: Node3D
var prop_root: Node3D
var level_root: Node3D
var objective_root: Node3D
var player_root: Node3D
var attract_demo_root: Node3D
var sentry_root: Node3D
var fx_root: Node3D
var collision_root: Node3D
var camera: Camera3D
var camera_focus := Vector3.ZERO
var camera_heading := Vector3(0.0, 0.0, -1.0)
var collision_obstacles: Array[Dictionary] = []

var hud_layer: CanvasLayer
var title_label: Label
var countdown_label: Label
var mission_label: Label
var status_label: Label
var score_label: Label
var timer_label: Label
var p1_label: Label
var p2_label: Label
var controls_label: Label
var result_label: Label
var storyboard_panel: PanelContainer
var storyboard_title_label: Label
var storyboard_route_label: Label
var storyboard_step_labels: Array[Label] = []
var story_toast_panel: PanelContainer
var story_toast_title_label: Label
var story_toast_body_label: Label
var story_toast_timer := 0.0
var phase_scene_panel: PanelContainer
var phase_scene_title_label: Label
var phase_scene_body_label: Label
var phase_scene_timer := 0.0
var objective_banner_panel: PanelContainer
var objective_banner_title_label: Label
var objective_banner_body_label: Label
var objective_banner_timer := 0.0
var screen_flash_rect: ColorRect
var screen_flash_timer := 0.0

func _ready() -> void:
	rng.randomize()
	_ensure_input_map()
	_configure_render_quality()
	_parse_launch_args()
	_configure_generation()
	_create_materials()
	_load_audio()
	_load_music()
	started_at_iso = _utc_now_iso()
	_create_world()
	_configure_players()
	_create_hud()
	_enter_attract_scene()
	_update_hud()

func _process(delta: float) -> void:
	if Input.is_action_just_pressed("restart"):
		get_tree().reload_current_scene()
		return

	match phase:
		"attract":
			_update_attract_scene(delta)
		"join":
			_update_join_countdown(delta)
		"briefing":
			_update_briefing_scene(delta)
		"play":
			_update_play(delta)
		"intermission":
			_update_intermission_scene(delta)
		"finished":
			pass

	if phase == "attract":
		_update_attract_camera(delta)
	else:
		_update_camera(delta)
	_animate_scene(delta)
	_update_fx_events(delta)
	_update_phase_scene(delta)
	_update_story_toast(delta)
	_update_objective_banner(delta)
	_update_screen_flash(delta)
	_update_hud()

func _ensure_input_map() -> void:
	_bind_key("p1_up", KEY_W)
	_bind_key("p1_left", KEY_A)
	_bind_key("p1_down", KEY_S)
	_bind_key("p1_right", KEY_D)
	_bind_key("p1_action", KEY_E)
	_bind_key("p2_up", KEY_UP)
	_bind_key("p2_left", KEY_LEFT)
	_bind_key("p2_down", KEY_DOWN)
	_bind_key("p2_right", KEY_RIGHT)
	_bind_key("p2_action", KEY_ENTER)
	_bind_key("restart", KEY_R)

func _bind_key(action: String, keycode: Key) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	for event in InputMap.action_get_events(action):
		if event is InputEventKey and event.physical_keycode == keycode:
			return
	var key := InputEventKey.new()
	key.physical_keycode = keycode
	InputMap.action_add_event(action, key)

func _configure_render_quality() -> void:
	var viewport := get_viewport()
	viewport.msaa_3d = Viewport.MSAA_4X
	viewport.screen_space_aa = Viewport.SCREEN_SPACE_AA_FXAA
	viewport.use_taa = true
	viewport.scaling_3d_scale = 1.0

func _parse_launch_args() -> void:
	launch_payload = _demo_launch_payload()
	callback_secret = OS.get_environment("NEXUS_GAME_CALLBACK_SECRET")
	var args := OS.get_cmdline_user_args()
	if args.is_empty():
		args = OS.get_cmdline_args()
	for index in range(args.size()):
		if args[index] == "--nexus-session-payload" and index + 1 < args.size():
			var payload_path := String(args[index + 1])
			if FileAccess.file_exists(payload_path):
				var parsed = JSON.parse_string(FileAccess.get_file_as_string(payload_path))
				if typeof(parsed) == TYPE_DICTIONARY:
					launch_payload = parsed
		elif args[index] == "--nexus-result-callback" and index + 1 < args.size():
			callback_url = String(args[index + 1])

	payload_by_slot.clear()
	var payload_players: Array = launch_payload.get("players", [])
	for player in payload_players:
		if typeof(player) == TYPE_DICTIONARY:
			payload_by_slot[player.get("slot", "P1")] = player

func _configure_generation() -> void:
	var seed_basis := "%s:%s:%s" % [
		launch_payload.get("siteId", "LOCAL-DEMO"),
		launch_payload.get("cabinetId", "DEMO-CABINET"),
		launch_payload.get("gameSessionId", Time.get_unix_time_from_system())
	]
	generation_seed = abs(hash(seed_basis))
	rng.seed = generation_seed

func _create_materials() -> void:
	materials["floor"] = _make_pbr_material("floor_panel_2k", Color("#8797A5"), 0.96, 0.68, Vector3(0.46, 0.46, 1.0), 0.2)
	materials["floor_alt"] = _make_pbr_material("smooth_metal", Color("#707F8E"), 0.92, 0.7, Vector3(0.64, 0.64, 1.0), 0.18)
	materials["wall"] = _make_pbr_material("smooth_metal", Color("#7D8CA1"), 0.95, 0.52, Vector3(1.4, 1.4, 1.0), 0.28)
	materials["panel"] = _make_pbr_material("panel_metal", Color("#788DA0"), 1.0, 0.58, Vector3(1.0, 1.0, 1.0), 0.26)
	materials["cyborg_character_skin"] = _make_texture_material(KENNEY_CHARACTER_SKINS["cyborg"], Color("#F4FBFF"), 0.58)
	materials["criminal_character_skin"] = _make_texture_material(KENNEY_CHARACTER_SKINS["criminal"], Color("#F4FBFF"), 0.58)
	materials["skater_female_character_skin"] = _make_texture_material(KENNEY_CHARACTER_SKINS["skater_female"], Color("#F4FBFF"), 0.58)
	materials["skater_male_character_skin"] = _make_texture_material(KENNEY_CHARACTER_SKINS["skater_male"], Color("#F4FBFF"), 0.58)
	materials["p1_character_skin"] = materials["cyborg_character_skin"]
	materials["p2_character_skin"] = materials["criminal_character_skin"]
	materials["floor_trim"] = _make_material(Color("#172330"), Color("#000000"), 0.0)
	materials["floor_bolt"] = _make_material(Color("#2F3F4A"), Color("#000000"), 0.0)
	materials["edge"] = _make_material(Color("#73FBD3"), Color("#73FBD3"), 0.48)
	materials["deep_edge"] = _make_material(Color("#22384B"), Color("#2F6C89"), 0.06)
	materials["glass"] = _make_material(Color("#476B84"), Color("#61B0D8"), 0.54, 0.38)
	materials["p1"] = _make_material(Color("#1FD6B5"), Color("#1FD6B5"), 0.65)
	materials["p1_secondary"] = _make_material(Color("#FF5A6A"), Color("#FF5A6A"), 0.32, 0.58)
	materials["p2"] = _make_material(Color("#7CFF6B"), Color("#7CFF6B"), 0.65)
	materials["p2_secondary"] = _make_material(Color("#6C8DFF"), Color("#6C8DFF"), 0.32, 0.58)
	materials["accent"] = _make_material(Color("#FFD166"), Color("#FFD166"), 0.46)
	materials["danger"] = _make_material(Color("#FF4D5E"), Color("#FF4D5E"), 0.52, 0.3)
	materials["core"] = _make_material(Color("#FFD166"), Color("#FFD166"), 0.72)
	materials["supply"] = _make_material(Color("#78E7FF"), Color("#78E7FF"), 0.36)
	materials["drone"] = _make_material(Color("#F7FBFF"), Color("#73FBD3"), 0.4)
	materials["sentry"] = _make_material(Color("#FF5A6A"), Color("#FF5A6A"), 0.34)
	materials["sentry_armor"] = _make_pbr_material("panel_metal", Color("#A94858"), 0.82, 0.5, Vector3(1.0, 1.0, 1.0), 0.24)
	materials["weapon"] = _make_pbr_material("smooth_metal", Color("#C7D3DF"), 0.94, 0.38, Vector3(1.0, 1.0, 1.0), 0.2)
	materials["weapon_charge"] = _make_material(Color("#73FBD3"), Color("#73FBD3"), 1.18, 0.74)
	materials["physics_prop"] = _make_pbr_material("panel_metal", Color("#91A3B4"), 0.86, 0.46, Vector3(1.0, 1.0, 1.0), 0.24)
	materials["success_fx"] = _make_material(Color("#73FBD3"), Color("#73FBD3"), 1.15, 0.72)
	materials["shadow"] = _make_material(Color("#050A12"), Color("#000000"), 0.0)

func _make_material(color: Color, emission_color: Color = Color.BLACK, emission_energy: float = 0.0, alpha: float = 1.0) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	var albedo := color
	albedo.a = alpha
	material.albedo_color = albedo
	material.roughness = 0.62
	if alpha < 1.0:
		material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	if emission_energy > 0.0:
		material.emission_enabled = true
		material.emission = emission_color
		material.emission_energy_multiplier = emission_energy
	return material

func _make_pbr_material(set_id: String, tint: Color, metallic_value: float, roughness_value: float, uv_scale: Vector3, normal_strength: float = 0.35) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = tint
	material.metallic = metallic_value
	material.roughness = roughness_value
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	material.uv1_scale = uv_scale
	var textures: Dictionary = PBR_TEXTURE_SETS.get(set_id, {})
	var albedo = _load_texture(textures.get("color", ""))
	if albedo:
		material.albedo_texture = albedo
	var normal = _load_texture(textures.get("normal", ""))
	if normal:
		material.normal_enabled = true
		material.normal_texture = normal
		material.normal_scale = normal_strength
	var roughness = _load_texture(textures.get("roughness", ""))
	if roughness:
		material.roughness_texture = roughness
	var metallic = _load_texture(textures.get("metallic", ""))
	if metallic:
		material.metallic_texture = metallic
	var ao = _load_texture(textures.get("ao", ""))
	if ao:
		material.ao_enabled = true
		material.ao_texture = ao
	return material

func _make_texture_material(texture_path: String, tint: Color, roughness_value: float) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = tint
	material.roughness = roughness_value
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	var texture = _load_texture(texture_path)
	if texture:
		material.albedo_texture = texture
	return material

func _load_texture(path: String):
	if path.is_empty():
		return null
	if texture_cache.has(path):
		return texture_cache[path]
	if ResourceLoader.exists(path):
		var resource = load(path)
		texture_cache[path] = resource
		return resource
	var image := Image.new()
	if image.load(path) == OK:
		var texture := ImageTexture.create_from_image(image)
		texture_cache[path] = texture
		return texture
	return null

func _load_audio() -> void:
	for key in SOUND_PATHS.keys():
		var stream = _load_audio_stream(SOUND_PATHS[key])
		if stream:
			var player := AudioStreamPlayer.new()
			player.stream = stream
			player.volume_db = -7.0
			add_child(player)
			audio_players[key] = player

func _load_music() -> void:
	var stream = _load_audio_stream(MUSIC_PATHS["arena"])
	if not stream:
		return
	if stream is AudioStreamOggVorbis:
		stream.loop = true
	music_player = AudioStreamPlayer.new()
	music_player.name = "ArenaMusic"
	music_player.stream = stream
	music_player.volume_db = -16.0
	add_child(music_player)

func _load_audio_stream(path: String):
	if ResourceLoader.exists(path):
		return load(path)
	if path.to_lower().ends_with(".ogg"):
		return AudioStreamOggVorbis.load_from_file(path)
	return null

func _play_sound(key: String) -> void:
	if audio_players.has(key):
		audio_players[key].stop()
		audio_players[key].play()

func _create_world() -> void:
	world_root = Node3D.new()
	world_root.name = "World"
	add_child(world_root)
	_create_environment()
	prop_root = Node3D.new()
	prop_root.name = "StationModules"
	world_root.add_child(prop_root)
	level_root = Node3D.new()
	level_root.name = "PhaseLevel"
	world_root.add_child(level_root)
	objective_root = Node3D.new()
	objective_root.name = "Objectives"
	world_root.add_child(objective_root)
	player_root = Node3D.new()
	player_root.name = "Players"
	world_root.add_child(player_root)
	attract_demo_root = Node3D.new()
	attract_demo_root.name = "AttractDemoOperators"
	world_root.add_child(attract_demo_root)
	sentry_root = Node3D.new()
	sentry_root.name = "Sentries"
	world_root.add_child(sentry_root)
	fx_root = Node3D.new()
	fx_root.name = "FX"
	world_root.add_child(fx_root)
	collision_root = Node3D.new()
	collision_root.name = "CollisionProxy"
	world_root.add_child(collision_root)

	_create_cinematic_lighting()

	camera = Camera3D.new()
	camera.name = "ArenaCamera"
	camera.projection = Camera3D.PROJECTION_PERSPECTIVE
	camera.fov = 70.0
	camera.near = 0.05
	camera.far = 90.0
	camera.position = Vector3(0, 2.7, 8.1)
	camera.current = true
	add_child(camera)
	camera.look_at(Vector3(0, 1.0, 2.8), Vector3.UP)

	_create_station_floor()
	_create_station_modules()
	_create_light_strips()
	_create_backdrop()
	_create_attract_demo_actors()

func _create_environment() -> void:
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color("#07111B")
	environment.ambient_light_color = Color("#A5BAD0")
	environment.ambient_light_energy = 0.78
	environment.glow_enabled = true
	environment.glow_intensity = 0.24
	environment.glow_bloom = 0.08
	environment.glow_hdr_threshold = 1.18
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	environment.tonemap_exposure = 1.42
	environment.tonemap_white = 3.25
	environment.ssao_enabled = true
	environment.ssao_radius = 2.4
	environment.ssao_intensity = 0.68
	environment.ssao_power = 1.05
	environment.ssil_enabled = true
	environment.ssil_radius = 4.0
	environment.ssil_intensity = 0.3
	environment.adjustment_enabled = true
	environment.adjustment_brightness = 1.08
	environment.adjustment_contrast = 1.04
	environment.adjustment_saturation = 1.04
	var world_environment := WorldEnvironment.new()
	world_environment.environment = environment
	add_child(world_environment)

func _create_cinematic_lighting() -> void:
	var sun := DirectionalLight3D.new()
	sun.name = "StationKeyLight"
	sun.light_color = Color("#CDE7FF")
	sun.light_energy = 3.35
	sun.light_angular_distance = 0.55
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 42.0
	sun.rotation_degrees = Vector3(-48, 28, -8)
	add_child(sun)

	var rim := DirectionalLight3D.new()
	rim.name = "MagentaRimLight"
	rim.light_color = Color("#9C5BFF")
	rim.light_energy = 0.82
	rim.shadow_enabled = false
	rim.rotation_degrees = Vector3(-22, -146, 0)
	add_child(rim)

	_add_spot_light("NorthBaySpot", Vector3(-6.8, 5.4, -5.6), Vector3(-2.4, 0.0, -1.4), Color("#73FBD3"), 5.4, 9.5, 36.0)
	_add_spot_light("SouthBaySpot", Vector3(7.2, 5.0, 5.8), Vector3(2.8, 0.0, 1.2), Color("#FFD166"), 4.7, 9.0, 38.0)
	_add_spot_light("CenterStorySpot", Vector3(0.0, 6.2, 1.8), Vector3(0.0, 0.0, 0.0), Color("#D7F1FF"), 4.2, 10.5, 46.0)
	_add_omni_light("PlayerFloorWash", Vector3(0.0, 3.2, 3.3), Color("#D9ECFF"), 1.75, 9.2)
	_add_omni_light("CoolFill", Vector3(-5.8, 2.8, 2.8), Color("#4EA1FF"), 1.55, 9.0)
	_add_omni_light("WarmFill", Vector3(5.7, 2.6, -2.6), Color("#FFB84A"), 1.35, 8.0)

func _add_spot_light(name: String, position: Vector3, target: Vector3, color: Color, energy: float, range: float, angle: float) -> SpotLight3D:
	var light := SpotLight3D.new()
	light.name = name
	light.position = position
	light.light_color = color
	light.light_energy = energy
	light.spot_range = range
	light.spot_angle = angle
	light.spot_angle_attenuation = 1.1
	light.shadow_enabled = true
	add_child(light)
	light.look_at(target, Vector3.UP)
	return light

func _add_omni_light(name: String, position: Vector3, color: Color, energy: float, range: float) -> OmniLight3D:
	var light := OmniLight3D.new()
	light.name = name
	light.position = position
	light.light_color = color
	light.light_energy = energy
	light.omni_range = range
	light.shadow_enabled = true
	add_child(light)
	return light

func _create_station_floor() -> void:
	var tile_size := 2.0
	for x in range(-6, 6):
		for z in range(-4, 4):
			var mat = materials["floor_alt"] if (x + z + generation_seed) % 3 == 0 else materials["floor"]
			var tile := _make_box(Vector3(tile_size - 0.08, 0.16, tile_size - 0.08), mat, Vector3(x * tile_size + 1.0, -0.08, z * tile_size + 1.0), prop_root)
			tile.name = "PBRFloorPanel"
			_make_box(Vector3(tile_size - 0.28, 0.018, 0.028), materials["floor_trim"], Vector3(x * tile_size + 1.0, 0.018, z * tile_size + 1.0 - tile_size * 0.45), prop_root)
			_make_box(Vector3(0.028, 0.018, tile_size - 0.28), materials["floor_trim"], Vector3(x * tile_size + 1.0 - tile_size * 0.45, 0.019, z * tile_size + 1.0), prop_root)
			if (x + z) % 4 == 0:
				_make_cylinder(0.045, 0.018, materials["floor_bolt"], Vector3(x * tile_size + 0.28, 0.035, z * tile_size + 0.28), prop_root)
				_make_cylinder(0.045, 0.018, materials["floor_bolt"], Vector3(x * tile_size + 1.72, 0.035, z * tile_size + 1.72), prop_root)

	_make_box(Vector3(24.6, 0.42, 0.38), materials["floor_trim"], Vector3(0, 0.08, ARENA_RECT.position.y), prop_root)
	_make_box(Vector3(24.6, 0.42, 0.38), materials["floor_trim"], Vector3(0, 0.08, ARENA_RECT.end.y), prop_root)
	_make_box(Vector3(0.38, 0.42, 13.4), materials["floor_trim"], Vector3(ARENA_RECT.position.x, 0.08, 0), prop_root)
	_make_box(Vector3(0.38, 0.42, 13.4), materials["floor_trim"], Vector3(ARENA_RECT.end.x, 0.08, 0), prop_root)
	_make_box(Vector3(24.2, 1.45, 0.22), materials["panel"], Vector3(0, 0.7, ARENA_RECT.position.y - 0.42), prop_root)
	_make_box(Vector3(24.2, 1.45, 0.22), materials["panel"], Vector3(0, 0.7, ARENA_RECT.end.y + 0.42), prop_root)
	_make_box(Vector3(0.22, 1.45, 13.1), materials["panel"], Vector3(ARENA_RECT.position.x - 0.42, 0.7, 0), prop_root)
	_make_box(Vector3(0.22, 1.45, 13.1), materials["panel"], Vector3(ARENA_RECT.end.x + 0.42, 0.7, 0), prop_root)
	_register_box_obstacle(Vector3(0, 0.7, ARENA_RECT.position.y - 0.42), Vector3(24.2, 1.45, 0.42), "NorthWall")
	_register_box_obstacle(Vector3(0, 0.7, ARENA_RECT.end.y + 0.42), Vector3(24.2, 1.45, 0.42), "SouthWall")
	_register_box_obstacle(Vector3(ARENA_RECT.position.x - 0.42, 0.7, 0), Vector3(0.42, 1.45, 13.1), "WestWall")
	_register_box_obstacle(Vector3(ARENA_RECT.end.x + 0.42, 0.7, 0), Vector3(0.42, 1.45, 13.1), "EastWall")
	for x in range(-5, 6, 2):
		_make_box(Vector3(0.18, 1.9, 0.18), materials["wall"], Vector3(x * 2.0, 1.0, ARENA_RECT.position.y - 0.62), prop_root)
		_make_box(Vector3(0.18, 1.9, 0.18), materials["wall"], Vector3(x * 2.0, 1.0, ARENA_RECT.end.y + 0.62), prop_root)

func _create_station_modules() -> void:
	var layout := [
		{ "key": "room_small", "pos": Vector3(-14.2, 0.0, -6.7), "rot": 0.0, "scale": 0.52, "fallback": Vector3(3.0, 1.1, 2.4) },
		{ "key": "room_wide", "pos": Vector3(14.3, 0.0, -6.2), "rot": PI, "scale": 0.5, "fallback": Vector3(3.6, 1.1, 2.4) },
		{ "key": "corridor", "pos": Vector3(-14.0, 0.0, 5.4), "rot": PI / 2.0, "scale": 0.5, "fallback": Vector3(4.0, 0.85, 1.2) },
		{ "key": "corridor_wide", "pos": Vector3(14.2, 0.0, 5.5), "rot": PI / 2.0, "scale": 0.46, "fallback": Vector3(4.8, 0.85, 1.5) },
		{ "key": "gate", "pos": Vector3(0.0, 0.0, -8.6), "rot": 0.0, "scale": 0.48, "fallback": Vector3(2.0, 1.5, 0.4) },
		{ "key": "cables", "pos": Vector3(-4.8, 0.0, 8.2), "rot": PI / 2.0, "scale": 0.58, "fallback": Vector3(2.6, 0.22, 0.4) },
		{ "key": "stairs", "pos": Vector3(5.0, 0.0, 8.2), "rot": 0.0, "scale": 0.46, "fallback": Vector3(1.6, 0.8, 1.2) }
	]

	for item in layout:
		var item_position: Vector3 = item["pos"]
		var item_rotation: float = item["rot"]
		var item_scale: float = item["scale"]
		var item_fallback: Vector3 = item["fallback"]
		var module_model := _spawn_model_or_block(MODULE_MODEL_PATHS[item["key"]], item_position, item_rotation, item_scale, item_fallback)
		if module_model:
			module_model.name = "Perimeter%s" % String(item["key"]).capitalize()

	var hero_props := [
		{ "key": "base_large", "pos": Vector3(-13.2, 0.0, -0.9), "rot": PI / 2.0, "scale": 0.24, "fallback": Vector3(2.6, 1.4, 2.6) },
		{ "key": "building_l", "pos": Vector3(13.0, 0.0, -0.8), "rot": -PI / 2.0, "scale": 0.24, "fallback": Vector3(2.0, 1.5, 3.2) },
		{ "key": "geodesic_dome", "pos": Vector3(-10.2, 0.0, 8.2), "rot": 0.0, "scale": 0.22, "fallback": Vector3(1.6, 1.0, 1.6) },
		{ "key": "solar_panel", "pos": Vector3(10.5, 0.0, 8.1), "rot": PI / 4.0, "scale": 0.3, "fallback": Vector3(1.6, 0.5, 0.7) },
		{ "key": "roof_radar", "pos": Vector3(-8.7, 0.0, -8.5), "rot": -PI / 5.0, "scale": 0.22, "fallback": Vector3(1.1, 1.2, 1.1) },
		{ "key": "metal_support", "pos": Vector3(8.7, 0.0, -8.4), "rot": 0.0, "scale": 0.34, "fallback": Vector3(0.7, 1.6, 0.7) }
	]
	for item in hero_props:
		var prop_position: Vector3 = item["pos"]
		var prop_rotation: float = item["rot"]
		var prop_fallback: Vector3 = item["fallback"]
		_spawn_quaternius_model(item["key"], prop_position, prop_rotation, item["scale"], prop_fallback)

	_create_playfield_cover()

func _create_playfield_cover() -> void:
	var cover_items := [
		{ "pos": Vector3(-5.6, 0.0, -1.6), "size": Vector3(1.5, 0.75, 0.72), "rot": 0.18 },
		{ "pos": Vector3(5.6, 0.0, -1.6), "size": Vector3(1.5, 0.75, 0.72), "rot": -0.18 },
		{ "pos": Vector3(-6.8, 0.0, 3.2), "size": Vector3(1.2, 0.65, 0.68), "rot": -0.45 },
		{ "pos": Vector3(6.8, 0.0, 3.2), "size": Vector3(1.2, 0.65, 0.68), "rot": 0.45 }
	]
	for index in range(cover_items.size()):
		var item: Dictionary = cover_items[index]
		var position: Vector3 = item["pos"]
		var size: Vector3 = item["size"]
		var rotation_y: float = item["rot"]
		var node := _make_box(size, materials["physics_prop"], position + Vector3(0.0, size.y * 0.5, 0.0), prop_root)
		node.name = "ReadableCover%d" % index
		node.rotation.y = rotation_y
		var footprint := _rotated_footprint_size(size, rotation_y)
		_register_box_obstacle(position + Vector3(0, size.y * 0.5, 0), Vector3(footprint.x + 0.12, size.y, footprint.z + 0.12), "ReadableCover%d" % index)

func _load_level_layout(level_index: int, move_players: bool = false) -> void:
	_clear_phase_level()
	var segments: Array[Dictionary] = []
	var guides: Array[Vector3] = []
	match level_index:
		-1:
			segments = [
				{ "name": "AttractNorthRail", "pos": Vector3(-5.8, 0.22, 1.95), "size": Vector3(5.2, 0.44, 0.24) },
				{ "name": "AttractSouthRail", "pos": Vector3(5.8, 0.22, -2.2), "size": Vector3(5.2, 0.44, 0.24) },
				{ "name": "AttractLeftGuide", "pos": Vector3(-2.7, 0.22, -1.9), "size": Vector3(0.24, 0.44, 4.3) },
				{ "name": "AttractRightGuide", "pos": Vector3(2.7, 0.22, 1.8), "size": Vector3(0.24, 0.44, 4.2) }
			]
			guides = [Vector3(-1.1, 0.045, 4.9), Vector3(-2.35, 0.045, 1.0), Vector3(-2.35, 0.045, -4.9), Vector3(2.35, 0.045, -4.9), Vector3(2.35, 0.045, 1.0), Vector3(1.1, 0.045, 4.9)]
		0:
			segments = [
				{ "name": "SparkLeftLane", "pos": Vector3(-5.9, 0.22, 1.9), "size": Vector3(6.2, 0.44, 0.24) },
				{ "name": "SparkRightLane", "pos": Vector3(5.9, 0.22, -1.9), "size": Vector3(6.2, 0.44, 0.24) },
				{ "name": "SparkWestTurn", "pos": Vector3(-3.1, 0.22, -2.45), "size": Vector3(0.24, 0.44, 4.1) },
				{ "name": "SparkEastTurn", "pos": Vector3(3.1, 0.22, 2.45), "size": Vector3(0.24, 0.44, 4.1) }
			]
			guides = [Vector3(0.0, 0.045, 4.4), Vector3(-2.2, 0.045, 1.0), Vector3(-2.8, 0.045, -3.6), Vector3(2.8, 0.045, -3.6), Vector3(2.2, 0.045, 1.0)]
		1:
			segments = [
				{ "name": "GateSplitCenter", "pos": Vector3(0.0, 0.22, -1.4), "size": Vector3(0.26, 0.44, 8.5) },
				{ "name": "GateLeftElbow", "pos": Vector3(-6.1, 0.22, 1.25), "size": Vector3(4.1, 0.44, 0.24) },
				{ "name": "GateRightElbow", "pos": Vector3(6.1, 0.22, 1.25), "size": Vector3(4.1, 0.44, 0.24) },
				{ "name": "GateNorthSwitchback", "pos": Vector3(0.0, 0.22, 3.25), "size": Vector3(7.8, 0.44, 0.24) }
			]
			guides = [Vector3(-6.7, 0.045, -1.4), Vector3(-2.2, 0.045, -4.8), Vector3(2.2, 0.045, -4.8), Vector3(6.7, 0.045, -1.4)]
		2:
			segments = [
				{ "name": "DemoLeftCover", "pos": Vector3(-4.9, 0.22, -3.9), "size": Vector3(4.1, 0.44, 0.24) },
				{ "name": "DemoRightCover", "pos": Vector3(4.9, 0.22, -3.9), "size": Vector3(4.1, 0.44, 0.24) },
				{ "name": "DemoSouthPocket", "pos": Vector3(0.0, 0.22, 2.25), "size": Vector3(6.6, 0.44, 0.24) },
				{ "name": "DemoLeftWing", "pos": Vector3(-7.6, 0.22, -0.8), "size": Vector3(0.24, 0.44, 4.5) },
				{ "name": "DemoRightWing", "pos": Vector3(7.6, 0.22, -0.8), "size": Vector3(0.24, 0.44, 4.5) }
			]
			guides = [Vector3(0.0, 0.045, 3.5), Vector3(-3.4, 0.045, -1.3), Vector3(3.4, 0.045, -1.3), Vector3(0.0, 0.045, -5.0)]
		_:
			segments = []
	for segment in segments:
		_add_level_barrier(segment)
	for index in range(guides.size()):
		_add_level_guide(guides[index], index)
	if move_players:
		_move_joined_players_to_level_start(level_index)

func _clear_phase_level() -> void:
	if level_root:
		_clear_children(level_root)
	for index in range(collision_obstacles.size() - 1, -1, -1):
		var obstacle: Dictionary = collision_obstacles[index]
		if String(obstacle.get("name", "")).begins_with("Level"):
			collision_obstacles.remove_at(index)
	if collision_root:
		for child in collision_root.get_children():
			if String(child.name).begins_with("Level"):
				child.queue_free()
	for projectile in projectiles:
		var projectile_node: Node3D = projectile.get("node")
		if projectile_node and is_instance_valid(projectile_node):
			projectile_node.queue_free()
	projectiles.clear()

func _add_level_barrier(segment: Dictionary) -> void:
	var name := "Level%s" % String(segment["name"])
	var position: Vector3 = segment["pos"]
	var size: Vector3 = segment["size"]
	var wall := _make_box(size, materials["glass"], position, level_root)
	wall.name = name
	var rail_size := Vector3(size.x + 0.12, 0.05, 0.18) if size.x >= size.z else Vector3(0.18, 0.05, size.z + 0.12)
	var rail := _make_box(rail_size, materials["edge"], position + Vector3(0.0, size.y * 0.5 + 0.035, 0.0), level_root)
	rail.name = "%sTopRail" % name
	var base_size := Vector3(size.x + 0.08, 0.06, 0.2) if size.x >= size.z else Vector3(0.2, 0.06, size.z + 0.08)
	var base := _make_box(base_size, materials["floor_trim"], position - Vector3(0.0, size.y * 0.5 - 0.03, 0.0), level_root)
	base.name = "%sBaseRail" % name
	_register_box_obstacle(position, Vector3(size.x + 0.1, 0.9, size.z + 0.1), name)

func _add_level_guide(position: Vector3, index: int) -> void:
	var guide := _make_box(Vector3(0.46, 0.035, 0.46), materials["accent"], position, level_root)
	guide.name = "LevelRouteGuide%d" % index
	var light := OmniLight3D.new()
	light.name = "LevelRouteGuideLight%d" % index
	light.light_color = Color("#73FBD3")
	light.light_energy = 0.32
	light.omni_range = 2.0
	light.position = position + Vector3(0.0, 0.42, 0.0)
	level_root.add_child(light)

func _move_joined_players_to_level_start(level_index: int) -> void:
	var starts := _level_start_positions(level_index)
	var joined := _joined_players()
	for index in range(joined.size()):
		var player: Dictionary = joined[index]
		var target: Vector3 = starts[min(index, starts.size() - 1)]
		target = _safe_spawn_position(target, PLAYER_RADIUS)
		player["position"] = target
		player["velocity"] = Vector3.ZERO
		player["moveVelocity"] = Vector3.ZERO
		player["aimDirection"] = Vector3(0.0, 0.0, -1.0)
		var node: Node3D = player["node"]
		node.position = target
		node.rotation = Vector3.ZERO

func _level_start_positions(level_index: int) -> Array[Vector3]:
	match level_index:
		1:
			return [Vector3(-0.8, 0.0, 5.25), Vector3(0.8, 0.0, 5.25)]
		2:
			return [Vector3(-0.8, 0.0, 4.15), Vector3(0.8, 0.0, 4.15)]
		_:
			return [Vector3(-0.8, 0.0, 5.15), Vector3(0.8, 0.0, 5.15)]

func _level_name(level_index: int) -> String:
	match level_index:
		0:
			return "Spark Switchback"
		1:
			return "Gate Split"
		2:
			return "Demo Hold"
		_:
			return "Attract Loop"

func _spawn_model_or_block(path: String, position: Vector3, rotation_y: float, scale_value: float, fallback_size: Vector3) -> Node3D:
	var model: Node3D = _load_model_instance(path)
	if model:
		model.position = position
		model.rotation.y = rotation_y
		model.scale = Vector3.ONE * scale_value
		_apply_model_materials(model, materials["panel"])
		prop_root.add_child(model)
		return model
	var fallback := _make_box(fallback_size * scale_value, materials["wall"], position + Vector3(0, fallback_size.y * scale_value * 0.5, 0), prop_root)
	fallback.rotation.y = rotation_y
	return fallback

func _spawn_quaternius_model(key: String, position: Vector3, rotation_y: float, scale_value: float, fallback_size: Vector3) -> Node3D:
	var model := _add_scene_model(QUATERNIUS_MODEL_PATHS.get(key, ""), prop_root, position, scale_value, rotation_y)
	if model:
		model.name = "%sProp" % key.capitalize()
		return model
	var scaled_size := fallback_size * scale_value
	var fallback := _make_box(scaled_size, materials["panel"], position + Vector3(0, scaled_size.y * 0.5, 0), prop_root)
	fallback.rotation.y = rotation_y
	return fallback

func _add_scene_model(path: String, parent: Node3D, position: Vector3, scale_value: float, rotation_y: float, material: Material = null) -> Node3D:
	if path.is_empty():
		return null
	var model: Node3D = _load_model_instance(path)
	if not model:
		return null
	model.position = position
	model.rotation.y = rotation_y
	model.scale = Vector3.ONE * scale_value
	_apply_model_materials(model, material)
	parent.add_child(model)
	return model

func _load_model_instance(path: String) -> Node3D:
	if ResourceLoader.exists(path):
		var resource = load(path)
		if resource is PackedScene:
			return resource.instantiate()
	var document := GLTFDocument.new()
	var state := GLTFState.new()
	if document.append_from_file(path, state) == OK:
		return document.generate_scene(state)
	return null

func _apply_model_materials(node: Node, material: Material = null) -> void:
	for child in node.get_children():
		if child is MeshInstance3D:
			if material:
				child.material_override = material
			child.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
		_apply_model_materials(child, material)

func _create_light_strips() -> void:
	for x in range(-4, 5, 2):
		for z in [-3.6, 0.0, 3.6]:
			var fixture := _make_box(Vector3(0.42, 0.035, 0.42), materials["glass"], Vector3(x * 2.0, 0.034, z), prop_root)
			fixture.name = "RecessedFloorFixture"
	for index in range(6):
		var lamp := OmniLight3D.new()
		lamp.position = Vector3(rng.randf_range(-8.0, 8.0), 2.35, rng.randf_range(-4.4, 4.4))
		lamp.light_energy = 0.62
		lamp.omni_range = 4.4
		lamp.light_color = Color("#73FBD3") if index % 2 == 0 else Color("#FFD166")
		prop_root.add_child(lamp)

func _create_backdrop() -> void:
	for index in range(90):
		var star_material = materials["edge"] if index % 4 == 0 else materials["accent"]
		var star := _make_sphere(rng.randf_range(0.018, 0.062), star_material, Vector3(rng.randf_range(-24.0, 24.0), rng.randf_range(6.0, 16.0), rng.randf_range(-18.0, 8.0)), prop_root)
		star.name = "DistantLight"
	for index in range(6):
		var panel := _make_box(Vector3(rng.randf_range(2.0, 5.0), 0.03, rng.randf_range(0.12, 0.24)), materials["glass"], Vector3(rng.randf_range(-12.0, 12.0), rng.randf_range(3.2, 6.5), rng.randf_range(-8.4, -7.2)), prop_root)
		panel.rotation.y = rng.randf_range(-0.4, 0.4)

func _create_attract_demo_actors() -> void:
	if not attract_demo_root:
		return
	_clear_children(attract_demo_root)
	var p1_style := _avatar_style_from_runtime(_demo_player("P1", "Nova", "#1FD6B5", "#FF5A6A", "#FFD166", true)["avatarRuntime"], "P1")
	var p2_style := _avatar_style_from_runtime(_demo_player("P2", "Vector", "#7CFF6B", "#6C8DFF", "#FFB000", true)["avatarRuntime"], "P2")
	var demo_actors := [
		{
			"slot": "P1",
			"primary": Color("#1FD6B5"),
			"secondary": Color("#FF5A6A"),
			"accent": Color("#FFD166"),
			"style": p1_style
		},
		{
			"slot": "P2",
			"primary": Color("#7CFF6B"),
			"secondary": Color("#6C8DFF"),
			"accent": Color("#FFB000"),
			"style": p2_style
		}
	]
	for index in range(demo_actors.size()):
		var actor_data: Dictionary = demo_actors[index]
		var actor := _build_player_node(actor_data["slot"], actor_data["primary"], actor_data["secondary"], actor_data["accent"], actor_data["style"])
		actor.name = "DemoOperator%d" % (index + 1)
		actor.position = Vector3(-2.2 + index * 4.4, 0.0, 1.2)
		actor.scale = Vector3.ONE * 0.96
		attract_demo_root.add_child(actor)
	attract_demo_root.visible = false

func _configure_players() -> void:
	var p1_payload: Dictionary = payload_by_slot.get("P1", _demo_player("P1", "Nova", "#1FD6B5", "#FF5A6A", "#FFD166", true))
	var p2_payload: Dictionary = payload_by_slot.get("P2", _demo_player("P2", "Vector", "#7CFF6B", "#6C8DFF", "#FFB000", true))
	var p2_auto_join := payload_by_slot.has("P2") and not bool(p2_payload.get("isGuest", true))

	players = [
		_create_player(p1_payload, Vector3(-0.7, 0.0, 4.9), true),
		_create_player(p2_payload, Vector3(0.7, 0.0, 4.9), p2_auto_join)
	]
	_refresh_player_visibility()
	if p2_auto_join:
		join_remaining = min(join_remaining, 4.0)

func _create_player(payload: Dictionary, start_position: Vector3, joined: bool) -> Dictionary:
	var runtime: Dictionary = payload.get("avatarRuntime", {})
	var colors: Dictionary = runtime.get("colors", {})
	var avatar: Dictionary = payload.get("avatar", {})
	var slot := String(payload.get("slot", "P1"))
	var primary := _color_from_string(colors.get("primary", avatar.get("primaryColor", "#00E5FF")), Color("#00E5FF"))
	var secondary := _color_from_string(colors.get("secondary", avatar.get("secondaryColor", "#FF5A6A")), Color("#FF5A6A"))
	var accent := _color_from_string(colors.get("accent", avatar.get("accentColor", "#FFD166")), Color("#FFD166"))
	var avatar_style := _avatar_style_from_runtime(runtime, slot)
	var node := _build_player_node(slot, primary, secondary, accent, avatar_style)
	node.position = start_position
	player_root.add_child(node)
	return {
		"slot": slot,
		"playerId": payload.get("playerId", "guest"),
		"displayName": payload.get("displayName", slot),
		"level": payload.get("level", 1),
		"payload": payload,
		"node": node,
		"position": start_position,
		"velocity": Vector3.ZERO,
		"moveVelocity": Vector3.ZERO,
		"energy": 100.0,
		"joined": joined,
		"hitCooldown": 0.0,
		"hazardTick": 0.0,
		"weaponCooldown": 0.0,
		"aimDirection": Vector3(0.0, 0.0, -1.0),
		"stridePhase": rng.randf_range(0.0, TAU),
		"primary": primary,
		"secondary": secondary,
		"accent": accent,
		"avatarStyle": avatar_style
	}

func _avatar_style_from_runtime(runtime: Dictionary, slot: String) -> Dictionary:
	var morphology: Dictionary = runtime.get("morphology", {})
	var equipment: Dictionary = runtime.get("equipment", {})
	var rendering: Dictionary = runtime.get("rendering", {})
	var body_id := String(equipment.get("body", morphology.get("bodyId", "body_neon_hero")))
	var body_type := String(morphology.get("bodyType", "hero"))
	var outfit_id := String(equipment.get("outfit", "outfit_grid"))
	var helmet_id := String(equipment.get("helmet", "helmet_none"))
	var hair_id := String(equipment.get("hair", "hair_none"))
	var visor_id := String(equipment.get("visor", "visor_clear"))
	var boots_id := String(equipment.get("boots", "boots_grid_runners"))
	var back_id := String(equipment.get("back", "back_none"))
	var trail_id := String(equipment.get("trail", "trail_neon"))
	var aura_id := String(equipment.get("aura", "aura_none"))
	var skin_key := "cyborg" if slot == "P1" else "criminal"
	var scale_value := 0.45
	var shoulder_scale := 1.0

	match body_id:
		"body_runner_core":
			skin_key = "skater_female"
			scale_value = 0.44
		"body_synth_athlete":
			skin_key = "skater_male"
			scale_value = 0.47
		"body_street_legend":
			skin_key = "criminal"
			scale_value = 0.445
		"body_android_prime":
			skin_key = "cyborg"
			scale_value = 0.465
		"body_guardian_frame":
			skin_key = "criminal"
			scale_value = 0.5
			shoulder_scale = 1.16
		_:
			if body_type == "runner":
				skin_key = "skater_female"
			elif body_type == "street":
				skin_key = "criminal"
			elif body_type == "android":
				skin_key = "cyborg"

	if rendering.has("skin"):
		skin_key = String(rendering["skin"])
	var engine_hints: Dictionary = rendering.get("engineHints", {})
	var godot_hints: Dictionary = engine_hints.get("godot", {})
	if godot_hints.has("scale"):
		scale_value = float(godot_hints["scale"])

	if outfit_id == "outfit_street_leather":
		skin_key = "criminal"
	elif outfit_id == "outfit_sunset_armor":
		skin_key = "cyborg"
	elif outfit_id == "outfit_laser_varsity" and body_type == "runner":
		skin_key = "skater_male"

	return {
		"bodyId": body_id,
		"bodyType": body_type,
		"skinKey": skin_key,
		"scale": scale_value,
		"shoulderScale": shoulder_scale,
		"outfitId": outfit_id,
		"helmetId": helmet_id,
		"hairId": hair_id,
		"visorId": visor_id,
		"bootsId": boots_id,
		"backId": back_id,
		"trailId": trail_id,
		"auraId": aura_id
	}

func _skin_material_for_style(style: Dictionary, slot: String) -> Material:
	var skin_key := String(style.get("skinKey", "cyborg" if slot == "P1" else "criminal"))
	var material_key := "%s_character_skin" % skin_key
	if materials.has(material_key):
		return materials[material_key]
	return materials["p1_character_skin"] if slot == "P1" else materials["p2_character_skin"]

func _build_player_node(slot: String, primary: Color, secondary: Color, accent: Color, avatar_style: Dictionary) -> Node3D:
	var root := Node3D.new()
	root.name = "%sOperator" % slot
	var body_mat := _make_pbr_material("smooth_metal", primary, 0.65, 0.42, Vector3(1.0, 1.0, 1.0))
	body_mat.emission_enabled = true
	body_mat.emission = primary
	body_mat.emission_energy_multiplier = 0.26
	var armor_mat := _make_pbr_material("panel_metal", secondary, 0.9, 0.48, Vector3(1.0, 1.0, 1.0))
	var ring_mat := _make_material(secondary, secondary, 0.42, 0.48)
	var accent_mat := _make_material(accent, accent, 0.9)
	var character_material: Material = _skin_material_for_style(avatar_style, slot)
	var model_scale: float = float(avatar_style.get("scale", 0.45))
	var character_model := _add_scene_model(KENNEY_CHARACTER_MODEL, root, Vector3(0, 0.0, 0), model_scale, PI, character_material)
	if character_model:
		character_model.name = "ImportedOperatorSuit"
		_attach_character_animations(character_model)
		_apply_avatar_accessories(root, avatar_style, primary, secondary, accent)
		_attach_player_weapon(root, accent, character_model)
		var shoulder_light := OmniLight3D.new()
		shoulder_light.name = "OperatorMoveLight"
		shoulder_light.light_color = primary
		shoulder_light.light_energy = 0.56
		shoulder_light.omni_range = 2.8
		shoulder_light.position = Vector3(0, 1.38, -0.12)
		root.add_child(shoulder_light)
		return root

	var suit_key := "astronaut" if slot == "P1" else "mech"
	var suit_scale := 0.52 if slot == "P1" else 0.34
	var suit_y := 0.24 if slot == "P1" else 0.02
	var suit_model := _add_scene_model(QUATERNIUS_MODEL_PATHS[suit_key], root, Vector3(0, suit_y, 0), suit_scale, PI)
	if suit_model:
		suit_model.name = "ImportedOperatorSuit"
		_attach_player_weapon(root, accent, suit_model)
		var operator_light := OmniLight3D.new()
		operator_light.name = "OperatorMoveLight"
		operator_light.light_color = primary
		operator_light.light_energy = 0.48
		operator_light.omni_range = 2.8
		operator_light.position = Vector3(0, 1.15, 0.1)
		root.add_child(operator_light)
		return root

	var capsule := CapsuleMesh.new()
	capsule.radius = 0.32
	capsule.height = 1.06
	var body := MeshInstance3D.new()
	body.mesh = capsule
	body.material_override = body_mat
	body.position = Vector3(0, 0.86, 0)
	root.add_child(body)

	_make_box(Vector3(0.82, 0.28, 0.34), armor_mat, Vector3(0, 1.1, 0.02), root)
	_make_box(Vector3(0.36, 0.22, 0.28), armor_mat, Vector3(-0.55, 0.98, 0.02), root)
	_make_box(Vector3(0.36, 0.22, 0.28), armor_mat, Vector3(0.55, 0.98, 0.02), root)
	_make_box(Vector3(0.18, 0.54, 0.2), body_mat, Vector3(-0.62, 0.63, 0.0), root)
	_make_box(Vector3(0.18, 0.54, 0.2), body_mat, Vector3(0.62, 0.63, 0.0), root)
	_make_box(Vector3(0.22, 0.62, 0.24), body_mat, Vector3(-0.2, 0.31, 0.0), root)
	_make_box(Vector3(0.22, 0.62, 0.24), body_mat, Vector3(0.2, 0.31, 0.0), root)
	_make_box(Vector3(0.58, 0.38, 0.18), armor_mat, Vector3(0, 0.96, 0.34), root)
	_make_sphere(0.24, armor_mat, Vector3(0, 1.56, 0), root)
	_make_box(Vector3(0.36, 0.08, 0.08), accent_mat, Vector3(0, 1.56, -0.22), root)
	_attach_player_weapon(root, accent)

	var ring_mesh := CylinderMesh.new()
	ring_mesh.top_radius = 0.78
	ring_mesh.bottom_radius = 0.78
	ring_mesh.height = 0.055
	ring_mesh.radial_segments = 48
	var ring := MeshInstance3D.new()
	ring.mesh = ring_mesh
	ring.material_override = ring_mat
	ring.position = Vector3(0, 0.04, 0)
	root.add_child(ring)

	var marker := _make_box(Vector3(0.18, 0.18, 0.78), accent_mat, Vector3(0, 0.74, -0.58), root)
	marker.name = "FacingMarker"
	return root

func _attach_player_weapon(root: Node3D, accent: Color, _character_model: Node3D = null) -> void:
	var weapon_root := Node3D.new()
	weapon_root.name = "PulseCarbine"
	weapon_root.position = Vector3(0.43, 0.88, -0.42)
	weapon_root.rotation_degrees = Vector3(-8.0, 8.0, -12.0)
	weapon_root.scale = Vector3.ONE * 1.12
	root.add_child(weapon_root)
	var stock := _make_box(Vector3(0.12, 0.16, 0.36), materials["weapon"], Vector3(0.0, 0.0, 0.08), weapon_root)
	stock.name = "WeaponStock"
	var grip := _make_box(Vector3(0.09, 0.24, 0.09), materials["weapon"], Vector3(0.0, -0.16, -0.04), weapon_root)
	grip.name = "WeaponGrip"
	var barrel := _make_box(Vector3(0.065, 0.065, 0.72), materials["weapon"], Vector3(0.0, 0.0, -0.32), weapon_root)
	barrel.name = "WeaponBarrel"
	var emitter := _make_sphere(0.085, _make_material(accent, accent, 1.2, 0.8), Vector3(0.0, 0.0, -0.72), weapon_root)
	emitter.name = "WeaponEmitter"

func _first_existing_bone_name(skeleton: Skeleton3D, candidates: Array[String]) -> String:
	for candidate in candidates:
		if skeleton.find_bone(candidate) >= 0:
			return candidate
	for index in range(skeleton.get_bone_count()):
		var bone_name := skeleton.get_bone_name(index)
		var normalized := bone_name.to_lower().replace("_", "").replace(" ", "").replace(":", "")
		if normalized.find("righthand") >= 0 or normalized.find("handr") >= 0:
			return bone_name
	return ""

func _apply_avatar_accessories(root: Node3D, style: Dictionary, primary: Color, secondary: Color, accent: Color) -> void:
	var body_mat := _make_pbr_material("smooth_metal", primary, 0.7, 0.42, Vector3(1.0, 1.0, 1.0), 0.2)
	body_mat.emission_enabled = true
	body_mat.emission = primary
	body_mat.emission_energy_multiplier = 0.16
	var armor_mat := _make_pbr_material("panel_metal", secondary, 0.92, 0.46, Vector3(1.0, 1.0, 1.0), 0.18)
	var accent_mat := _make_material(accent, accent, 0.78)
	var glass_mat := _make_material(secondary, secondary, 0.34, 0.48)
	var dark_mat := _make_material(Color("#0B101C"), Color("#000000"), 0.0)
	var shoulder_scale: float = float(style.get("shoulderScale", 1.0))
	var outfit_id := String(style.get("outfitId", "outfit_grid"))
	var helmet_id := String(style.get("helmetId", "helmet_none"))
	var hair_id := String(style.get("hairId", "hair_none"))
	var visor_id := String(style.get("visorId", "visor_clear"))
	var boots_id := String(style.get("bootsId", "boots_grid_runners"))
	var back_id := String(style.get("backId", "back_none"))
	var trail_id := String(style.get("trailId", "trail_neon"))
	var aura_id := String(style.get("auraId", "aura_none"))

	if shoulder_scale > 1.05:
		_make_box(Vector3(0.3, 0.14, 0.26), armor_mat, Vector3(-0.36, 1.18, -0.02), root)
		_make_box(Vector3(0.3, 0.14, 0.26), armor_mat, Vector3(0.36, 1.18, -0.02), root)

	if outfit_id == "outfit_sunset_armor":
		_make_box(Vector3(0.48 * shoulder_scale, 0.42, 0.08), armor_mat, Vector3(0, 0.96, -0.19), root).name = "PassportArmorChest"
		_make_box(Vector3(0.2, 0.08, 0.1), accent_mat, Vector3(-0.14, 1.02, -0.25), root)
		_make_box(Vector3(0.2, 0.08, 0.1), accent_mat, Vector3(0.14, 1.02, -0.25), root)
	elif outfit_id == "outfit_street_leather" or outfit_id == "outfit_founder_jacket":
		_make_box(Vector3(0.54 * shoulder_scale, 0.38, 0.07), dark_mat, Vector3(0, 0.98, -0.2), root).name = "PassportJacket"
		_make_box(Vector3(0.08, 0.34, 0.08), accent_mat, Vector3(-0.22, 0.98, -0.25), root)
	elif outfit_id == "outfit_battle_harness":
		var strap_a := _make_box(Vector3(0.08, 0.58, 0.09), armor_mat, Vector3(-0.15, 0.98, -0.24), root)
		strap_a.rotation.z = -0.42
		var strap_b := _make_box(Vector3(0.08, 0.58, 0.09), armor_mat, Vector3(0.15, 0.98, -0.24), root)
		strap_b.rotation.z = 0.42
	elif outfit_id == "outfit_laser_varsity":
		_make_box(Vector3(0.5 * shoulder_scale, 0.32, 0.07), body_mat, Vector3(0, 0.98, -0.22), root).name = "PassportVarsityPanel"
		_make_box(Vector3(0.26, 0.06, 0.08), accent_mat, Vector3(0, 1.09, -0.27), root)

	if helmet_id != "helmet_none":
		var helmet := _make_sphere(0.26, armor_mat, Vector3(0, 1.5, -0.01), root)
		helmet.name = "PassportHelmet"
		helmet.scale = Vector3(1.08, 0.82, 1.0)
		if helmet_id.find("mohawk") >= 0 or helmet_id.find("ridge") >= 0 or helmet_id.find("viper") >= 0:
			_make_box(Vector3(0.09, 0.13, 0.32), accent_mat, Vector3(0, 1.68, -0.04), root).name = "PassportHelmetCrest"
		if helmet_id.find("football") >= 0:
			for x in [-0.12, 0.0, 0.12]:
				_make_box(Vector3(0.025, 0.22, 0.04), accent_mat, Vector3(x, 1.45, -0.27), root)
	elif hair_id != "hair_none":
		if hair_id.find("glowhawk") >= 0 or hair_id.find("cyberhawk") >= 0:
			var ridge := _make_box(Vector3(0.1, 0.13, 0.38), accent_mat, Vector3(0, 1.66, -0.02), root)
			ridge.name = "PassportGlowhawk"
			ridge.rotation.x = -0.12
		elif hair_id.find("mullet") >= 0:
			_make_box(Vector3(0.34, 0.18, 0.22), dark_mat, Vector3(0, 1.62, 0.12), root).name = "PassportMullet"
			_make_box(Vector3(0.08, 0.08, 0.28), accent_mat, Vector3(0.21, 1.63, 0.04), root)
		elif hair_id.find("curls") >= 0:
			for angle_index in range(5):
				var angle := float(angle_index) / 5.0 * TAU
				_make_sphere(0.075, dark_mat, Vector3(cos(angle) * 0.15, 1.64, sin(angle) * 0.08 - 0.02), root)
		else:
			var cap := _make_sphere(0.23, dark_mat, Vector3(0, 1.58, -0.01), root)
			cap.name = "PassportHairCap"
			cap.scale = Vector3(1.0, 0.38, 0.82)

	if visor_id != "visor_clear":
		_make_box(Vector3(0.36, 0.07, 0.045), glass_mat, Vector3(0, 1.48, -0.27), root).name = "PassportVisor"
		if visor_id == "visor_shutter":
			for index in range(3):
				_make_box(Vector3(0.36, 0.012, 0.052), accent_mat, Vector3(0, 1.455 + index * 0.032, -0.305), root)

	if boots_id == "boots_combat_neon" or boots_id == "boots_chrome_stompers":
		_make_box(Vector3(0.16, 0.16, 0.22), armor_mat, Vector3(-0.13, 0.12, -0.06), root)
		_make_box(Vector3(0.16, 0.16, 0.22), armor_mat, Vector3(0.13, 0.12, -0.06), root)
	elif boots_id == "boots_hover_soles":
		_make_box(Vector3(0.18, 0.04, 0.24), accent_mat, Vector3(-0.13, 0.07, -0.05), root)
		_make_box(Vector3(0.18, 0.04, 0.24), accent_mat, Vector3(0.13, 0.07, -0.05), root)

	if back_id == "back_boost_pack":
		var backpack := _make_box(Vector3(0.28, 0.44, 0.16), armor_mat, Vector3(0, 0.86, 0.28), root)
		backpack.name = "PassportBoostPack"
		var thruster_left := _make_cylinder(0.055, 0.24, accent_mat, Vector3(-0.11, 0.68, 0.36), root)
		var thruster_right := _make_cylinder(0.055, 0.24, accent_mat, Vector3(0.11, 0.68, 0.36), root)
		thruster_left.rotation.x = PI / 2.0
		thruster_right.rotation.x = PI / 2.0
	elif back_id == "back_arcade_cape":
		var cape := _make_box(Vector3(0.5, 0.66, 0.035), glass_mat, Vector3(0, 0.72, 0.35), root)
		cape.name = "PassportCape"
		cape.rotation.x = 0.16
	elif back_id == "back_katana_pair":
		var blade_a := _make_box(Vector3(0.04, 0.9, 0.04), accent_mat, Vector3(-0.12, 0.88, 0.35), root)
		blade_a.rotation.z = 0.72
		var blade_b := _make_box(Vector3(0.04, 0.9, 0.04), accent_mat, Vector3(0.12, 0.88, 0.35), root)
		blade_b.rotation.z = -0.72
	elif back_id == "back_boom_box":
		_make_box(Vector3(0.44, 0.26, 0.18), armor_mat, Vector3(0, 0.9, 0.32), root).name = "PassportBoomBox"

	if aura_id != "aura_none":
		var aura_mesh := TorusMesh.new()
		aura_mesh.inner_radius = 0.44
		aura_mesh.outer_radius = 0.5
		aura_mesh.ring_segments = 72
		var aura := MeshInstance3D.new()
		aura.name = "PassportAuraRing"
		aura.mesh = aura_mesh
		aura.material_override = _make_material(accent, accent, 0.76, 0.52)
		aura.position = Vector3(0, 0.08, 0)
		aura.rotation.x = PI / 2.0
		root.add_child(aura)

	if trail_id != "trail_neon":
		var trail_mat := _make_material(accent if trail_id == "trail_comet" or trail_id == "trail_fireline" else secondary, accent, 0.48, 0.4)
		var trail_left := _make_box(Vector3(0.06, 0.035, 0.64), trail_mat, Vector3(-0.18, 0.09, 0.48), root)
		var trail_right := _make_box(Vector3(0.06, 0.035, 0.64), trail_mat, Vector3(0.18, 0.09, 0.48), root)
		trail_left.name = "PassportTrailRibbon"
		trail_right.name = "PassportTrailRibbon"

func _refresh_player_visibility() -> void:
	for player in players:
		player["node"].visible = bool(player["joined"])

func _enter_attract_scene() -> void:
	phase = "attract"
	scene_timer = 0.0
	attract_demo_time = 0.0
	join_remaining = JOIN_COUNTDOWN_SECONDS
	mission_index = 0
	mission_status = "Attract demo is previewing the next route."
	_load_level_layout(-1)
	if player_root:
		player_root.visible = false
	if attract_demo_root:
		attract_demo_root.visible = true
	_show_phase_scene("Attract Demo", "Watch the route, then move or fire to open the join window.", Color("#73FBD3"), 0.0, "radial")

func _update_attract_scene(delta: float) -> void:
	scene_timer += delta
	attract_demo_time += delta
	_animate_attract_demo_actors(delta)
	if Input.is_action_just_pressed("p2_action") and players.size() > 1:
		players[1]["joined"] = true
	if scene_timer >= ATTRACT_DEMO_SECONDS or _start_input_pressed():
		_start_join_window()

func _start_join_window() -> void:
	phase = "join"
	scene_timer = 0.0
	join_remaining = 4.0 if players.size() > 1 and bool(players[1]["joined"]) else JOIN_COUNTDOWN_SECONDS
	if player_root:
		player_root.visible = true
	if attract_demo_root:
		attract_demo_root.visible = false
	_refresh_player_visibility()
	mission_status = "P2 can join before the route locks."
	_play_sound("select")
	_show_phase_scene("Join Window", "P2 can press Enter. Route locks when the countdown ends.", Color("#73FBD3"), 3.4, "horizontal")

func _start_briefing_scene() -> void:
	active_player_count = _joined_players().size()
	if active_player_count <= 0 and players.size() > 0:
		players[0]["joined"] = true
		active_player_count = 1
		_refresh_player_visibility()
	phase = "briefing"
	scene_timer = BRIEFING_SECONDS
	mission_index = 0
	mission_status = _story_brief_for_index(0)
	_play_sound("click")
	_show_phase_scene(_story_title_for_index(0), _story_brief_for_index(0), Color("#FFD166"), BRIEFING_SECONDS, "curtains")

func _update_briefing_scene(delta: float) -> void:
	scene_timer = max(0.0, scene_timer - delta)
	if scene_timer <= 0.0:
		_start_mission_run()

func _start_intermission_scene(completed_name: String, message: String) -> void:
	phase = "intermission"
	scene_timer = INTERMISSION_SECONDS
	_load_level_layout(mission_index, true)
	var next_title := _story_title_for_index(mission_index)
	var next_brief := _story_brief_for_index(mission_index)
	mission_status = "Loading level: %s" % _level_name(mission_index)
	_show_phase_scene("%s Complete" % completed_name, "%s\nNext level: %s\n%s" % [message, _level_name(mission_index), next_brief], Color("#FFD166"), INTERMISSION_SECONDS, "diagonal")

func _update_intermission_scene(delta: float) -> void:
	scene_timer = max(0.0, scene_timer - delta)
	if camera:
		var orbit_focus := Vector3(0.0, 1.25, 0.0)
		camera_focus = camera_focus.lerp(orbit_focus, min(1.0, delta * 1.8))
	if scene_timer <= 0.0:
		phase = "play"
		mission_status = _story_brief_for_index(mission_index)
		_show_phase_scene("%s: %s" % [_level_name(mission_index), _story_title_for_index(mission_index)], _story_brief_for_index(mission_index), Color("#73FBD3"), 2.8, "circle")

func _start_input_pressed() -> bool:
	return (
		Input.is_action_just_pressed("p1_action")
		or Input.is_action_just_pressed("p2_action")
		or Input.get_action_strength("p1_up") > 0.2
		or Input.get_action_strength("p1_down") > 0.2
		or Input.get_action_strength("p1_left") > 0.2
		or Input.get_action_strength("p1_right") > 0.2
		or Input.get_action_strength("p2_up") > 0.2
		or Input.get_action_strength("p2_down") > 0.2
		or Input.get_action_strength("p2_left") > 0.2
		or Input.get_action_strength("p2_right") > 0.2
	)

func _animate_attract_demo_actors(delta: float) -> void:
	if not attract_demo_root:
		return
	for index in range(attract_demo_root.get_child_count()):
		var actor := attract_demo_root.get_child(index) as Node3D
		if not actor:
			continue
		_move_attract_demo_actor(actor, index, delta)

func _move_attract_demo_actor(actor: Node3D, actor_index: int, delta: float) -> void:
	var path := _attract_demo_path(actor_index)
	if path.is_empty():
		return
	var path_index := int(actor.get_meta("pathIndex", actor_index % path.size()))
	var target: Vector3 = path[path_index]
	var offset := Vector2(target.x - actor.position.x, target.z - actor.position.z)
	if offset.length() < 0.28:
		path_index = (path_index + 1) % path.size()
		actor.set_meta("pathIndex", path_index)
		target = path[path_index]
		offset = Vector2(target.x - actor.position.x, target.z - actor.position.z)
	if offset.length() <= 0.01:
		_animate_demo_operator(actor, 0.0, delta)
		return
	var direction := offset.normalized()
	var speed := 2.2 + float(actor_index) * 0.18
	var next_position := actor.position + Vector3(direction.x, 0.0, direction.y) * speed * delta
	next_position.y = 0.0
	if _collides_with_static(next_position, PLAYER_RADIUS * 0.9):
		path_index = (path_index + 1) % path.size()
		actor.set_meta("pathIndex", path_index)
		return
	actor.position = next_position
	actor.look_at(actor.position + Vector3(direction.x, 0.0, direction.y), Vector3.UP)
	_animate_demo_operator(actor, 1.0, delta)

func _attract_demo_path(actor_index: int) -> Array[Vector3]:
	if actor_index % 2 == 0:
		return [
			Vector3(-1.1, 0.0, 4.9),
			Vector3(-0.6, 0.0, 2.7),
			Vector3(-2.35, 0.0, 1.0),
			Vector3(-2.35, 0.0, -4.9),
			Vector3(0.0, 0.0, -5.55),
			Vector3(2.35, 0.0, -4.9),
			Vector3(2.35, 0.0, 1.0),
			Vector3(0.6, 0.0, 2.7)
		]
	return [
		Vector3(1.1, 0.0, 4.9),
		Vector3(0.6, 0.0, 2.7),
		Vector3(2.35, 0.0, 1.0),
		Vector3(2.35, 0.0, -4.9),
		Vector3(0.0, 0.0, -5.55),
		Vector3(-2.35, 0.0, -4.9),
		Vector3(-2.35, 0.0, 1.0),
		Vector3(-0.6, 0.0, 2.7)
	]

func _animate_demo_operator(actor: Node3D, speed_ratio: float, delta: float) -> void:
	var stride_phase: float = float(actor.get_meta("stridePhase", 0.0)) + delta * lerp(3.0, 8.2, speed_ratio)
	actor.set_meta("stridePhase", stride_phase)
	var suit := actor.get_node_or_null("ImportedOperatorSuit") as Node3D
	if not suit:
		return
	suit.rotation.x = lerp_angle(suit.rotation.x, sin(stride_phase) * 0.045 * speed_ratio, min(1.0, delta * 9.0))
	var animation_player := suit.get_node_or_null("OperatorAnimationPlayer") as AnimationPlayer
	if animation_player:
		var target_animation := "run" if speed_ratio > 0.08 else "idle"
		if animation_player.current_animation != target_animation:
			animation_player.play(target_animation, 0.15)
		animation_player.speed_scale = lerp(0.85, 1.18, speed_ratio)
		return
	var skeleton := _find_skeleton_node(suit)
	if skeleton:
		var stride := sin(stride_phase) * 0.42 * speed_ratio
		var counter_stride := sin(stride_phase + PI) * 0.42 * speed_ratio
		_set_bone_pose_rotation(skeleton, "LeftArm", Vector3(1, 0, 0), counter_stride * 0.7)
		_set_bone_pose_rotation(skeleton, "RightArm", Vector3(1, 0, 0), stride * 0.7)
		_set_bone_pose_rotation(skeleton, "LeftUpLeg", Vector3(1, 0, 0), stride)
		_set_bone_pose_rotation(skeleton, "RightUpLeg", Vector3(1, 0, 0), counter_stride)

func _attach_character_animations(character_model: Node3D) -> void:
	var animation_player := AnimationPlayer.new()
	animation_player.name = "OperatorAnimationPlayer"
	animation_player.root_node = NodePath("..")
	character_model.add_child(animation_player)
	var library := AnimationLibrary.new()
	animation_player.add_animation_library("", library)
	_copy_character_animation(KENNEY_CHARACTER_ANIMATIONS["idle"], "Root|Idle", library, "idle")
	_copy_character_animation(KENNEY_CHARACTER_ANIMATIONS["run"], "Root|Run", library, "run")
	_copy_character_animation(KENNEY_CHARACTER_ANIMATIONS["jump"], "Root|Jump", library, "jump")
	if library.has_animation("idle"):
		animation_player.play("idle")

func _copy_character_animation(scene_path: String, source_name: String, target_library: AnimationLibrary, target_name: String) -> void:
	var source_scene := _load_model_instance(scene_path)
	if not source_scene:
		return
	var source_player := _find_animation_player(source_scene)
	if not source_player:
		return
	for library_name in source_player.get_animation_library_list():
		var library := source_player.get_animation_library(library_name)
		if library and library.has_animation(source_name):
			target_library.add_animation(target_name, library.get_animation(source_name).duplicate(true))
			return

func _find_animation_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node
	for child in node.get_children():
		var found := _find_animation_player(child)
		if found:
			return found
	return null

func _update_join_countdown(delta: float) -> void:
	join_remaining = max(0.0, join_remaining - delta)
	if Input.is_action_just_pressed("p2_action"):
		_join_second_player()
	if _joined_players().size() >= 2:
		join_remaining = min(join_remaining, 2.5)
	if join_remaining <= 0.0:
		_start_mission_run()

func _join_second_player() -> void:
	if players.size() < 2 or bool(players[1]["joined"]):
		return
	players[1]["joined"] = true
	players[1]["node"].visible = true
	_play_sound("switch")
	_show_story_event("Second operator joined", "Linked co-op objectives will activate when the countdown ends.")
	join_remaining = min(join_remaining, 3.0)

func _start_mission_run() -> void:
	active_player_count = _joined_players().size()
	if active_player_count <= 0:
		players[0]["joined"] = true
		active_player_count = 1
	phase = "play"
	elapsed_seconds = 0.0
	threat_grace_remaining = THREAT_GRACE_SECONDS
	mission_index = 0
	team_score = 0
	relay_progress = [0.0, 0.0]
	sync_progress = 0.0
	sync_required = 3.5 if active_player_count > 1 else 4.7
	camera_heading = Vector3(0.0, 0.0, -1.0)
	_load_level_layout(0, true)
	if players.size() > 0:
		camera_focus = players[0]["position"] + Vector3(0, 1.05, 0)
		camera.position = _safe_camera_position(camera_focus + Vector3(0, 3.35, 5.1), camera_focus)
	_create_missions()
	_play_sound("confirm")
	if music_player and not music_player.playing:
		music_player.play()
	mission_status = "Safe launch: learn movement and collect nearby sparks."
	_show_phase_scene("%s: %s" % [_level_name(0), _story_title_for_index(0)], mission_status, Color("#73FBD3"), 2.8, "circle")
	if players.size() > 0:
		_spawn_burst(players[0]["position"] + Vector3(0, 0.4, 0), Color("#73FBD3"), 0.9)

func _create_missions() -> void:
	_clear_children(objective_root)
	_clear_children(sentry_root)
	_clear_children(fx_root)
	relay_pads.clear()
	data_cores.clear()
	supply_caches.clear()
	hazards.clear()
	sentries.clear()
	physics_props.clear()
	projectiles.clear()
	fx_events.clear()

	var anchors := _generate_objective_anchors()
	anchors["relay_alpha"] = _safe_spawn_position(anchors["relay_alpha"], 1.32)
	anchors["relay_omega"] = _safe_spawn_position(anchors["relay_omega"], 1.32)
	anchors["drone_target"] = _safe_spawn_position(anchors["drone_target"], 1.65)
	relay_pads = [
		_spawn_relay_pad("alpha", anchors["relay_alpha"], materials["p1"]),
		_spawn_relay_pad("omega", anchors["relay_omega"], materials["p2"])
	]

	var core_count := 7 if active_player_count > 1 else 5
	for index in range(core_count):
		data_cores.append(_spawn_core(_random_open_point_away_from_players(ARENA_RECT.grow(-2.0), 1.05, 1.9), index))

	for index in range(4 if active_player_count > 1 else 3):
		supply_caches.append(_spawn_supply_cache(_random_open_point_away_from_players(ARENA_RECT.grow(-1.8), 1.2, 2.8), index))

	for index in range(1 if active_player_count > 1 else 0):
		hazards.append(_spawn_hazard(_random_open_point_away_from_players(ARENA_RECT.grow(-2.2), 1.7, 7.0), rng.randf_range(0.75, 0.95), index))

	for index in range(2 if active_player_count > 1 else 1):
		sentries.append(_spawn_sentry(_random_open_point_away_from_players(ARENA_RECT.grow(-2.0), 1.1, 8.6), index))

	for index in range(4 if active_player_count > 1 else 3):
		physics_props.append(_spawn_physics_prop(_random_open_point_away_from_players(ARENA_RECT.grow(-1.7), 1.25, 2.8), index))

	drone = _spawn_extraction_gate(anchors["drone_target"])

func _generate_objective_anchors() -> Dictionary:
	return {
		"relay_alpha": Vector3(-6.9, 0.0, -1.4),
		"relay_omega": Vector3(6.9, 0.0, -1.4),
		"drone_start": Vector3(0.0, 0.0, 2.0),
		"drone_target": Vector3(0.0, 0.0, -5.15)
	}

func _spawn_relay_pad(id: String, position: Vector3, material: Material) -> Dictionary:
	var node := Node3D.new()
	node.name = "%sRelay" % id.capitalize()
	node.position = position
	objective_root.add_child(node)
	var platform := _add_scene_model(QUATERNIUS_MODEL_PATHS["base_large"], node, Vector3(0, 0.04, 0), 0.2, 0.0)
	if platform:
		platform.name = "RelayBase"
	else:
		_make_cylinder(1.05, 0.2, materials["panel"], Vector3(0, 0.1, 0), node)
	var radar := _add_scene_model(QUATERNIUS_MODEL_PATHS["roof_radar"], node, Vector3(0, 0.14, 0), 0.18, 0.0)
	if radar:
		radar.name = "RelayRadarArray"
	var beacon := _add_scene_model(QUATERNIUS_MODEL_PATHS["pickup_thunder"], node, Vector3(0, 0.74, 0), 0.62, 0.0)
	if not beacon:
		beacon = _make_sphere(0.24, material, Vector3(0, 0.74, 0), node)
	beacon.name = "BeaconModel"
	_make_box(Vector3(1.1, 0.045, 0.18), materials["floor_trim"], Vector3(0, 0.16, -0.72), node)
	_make_box(Vector3(0.18, 0.045, 1.1), materials["floor_trim"], Vector3(-0.72, 0.16, 0), node)
	var light := OmniLight3D.new()
	light.light_color = Color("#73FBD3") if id == "alpha" else Color("#7CFF6B")
	light.light_energy = 0.68
	light.omni_range = 3.7
	light.position = Vector3(0, 1.05, 0)
	node.add_child(light)
	return { "id": id, "position": position, "radius": 1.18, "node": node, "beacon": beacon, "complete": false }

func _spawn_core(position: Vector3, index: int) -> Dictionary:
	var node := Node3D.new()
	node.name = "RiftCore%d" % index
	node.position = position + Vector3(0, 0.35, 0)
	objective_root.add_child(node)
	var core_model := _add_scene_model(QUATERNIUS_MODEL_PATHS["pickup_sphere"], node, Vector3(0, 0.1, 0), 0.74, 0.0)
	if core_model:
		core_model.name = "ImportedRiftCore"
	else:
		_make_sphere(0.34, materials["core"], Vector3.ZERO, node)
	var pedestal := _add_scene_model(QUATERNIUS_MODEL_PATHS["pickup_crate"], node, Vector3(0, -0.18, 0), 0.36, 0.0)
	if pedestal:
		pedestal.name = "CorePedestalModel"
	else:
		_make_cylinder(0.28, 0.32, materials["glass"], Vector3(0, -0.28, 0), node)
	var light := OmniLight3D.new()
	light.light_color = Color("#FFD166")
	light.light_energy = 0.62
	light.omni_range = 3.4
	node.add_child(light)
	return { "id": "core-%d" % index, "position": position, "node": node, "collected": false }

func _spawn_supply_cache(position: Vector3, index: int) -> Dictionary:
	var node := Node3D.new()
	node.name = "SupplyCache%d" % index
	node.position = position + Vector3(0, 0.24, 0)
	objective_root.add_child(node)
	var crate := _add_scene_model(QUATERNIUS_MODEL_PATHS["pickup_crate"], node, Vector3(0, -0.05, 0), 0.44, rng.randf_range(0.0, TAU))
	if crate:
		crate.name = "SupplyCrateModel"
	else:
		_make_box(Vector3(0.48, 0.34, 0.48), materials["panel"], Vector3(0, 0.05, 0), node)
	var keycard := _add_scene_model(QUATERNIUS_MODEL_PATHS["pickup_key_card"], node, Vector3(0, 0.48, 0), 0.52, rng.randf_range(0.0, TAU), materials["supply"])
	if keycard:
		keycard.name = "SupplyKeycardModel"
	else:
		_make_box(Vector3(0.42, 0.06, 0.28), materials["supply"], Vector3(0, 0.48, 0), node)
	var light := OmniLight3D.new()
	light.light_color = Color("#78E7FF")
	light.light_energy = 0.42
	light.omni_range = 2.6
	light.position = Vector3(0, 0.48, 0)
	node.add_child(light)
	return { "id": "supply-%d" % index, "position": position, "node": node, "collected": false, "radius": 1.05 }

func _spawn_hazard(position: Vector3, radius: float, index: int) -> Dictionary:
	var hazard_root := Node3D.new()
	hazard_root.name = "RiftHazard%d" % index
	hazard_root.position = Vector3(position.x, 0.08, position.z)
	fx_root.add_child(hazard_root)
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = 0.05
	mesh.radial_segments = 72
	var node := MeshInstance3D.new()
	node.name = "DamageField"
	node.mesh = mesh
	node.material_override = materials["danger"]
	hazard_root.add_child(node)
	var rift_model := _add_scene_model(QUATERNIUS_MODEL_PATHS["pickup_thunder"], hazard_root, Vector3(0, 0.72, 0), 0.56, rng.randf_range(0.0, TAU), materials["danger"])
	if rift_model:
		rift_model.name = "RiftAnchorModel"
	else:
		_make_sphere(radius * 0.24, materials["danger"], Vector3(0, 0.72, 0), hazard_root)
	var light := OmniLight3D.new()
	light.light_color = Color("#FF4D5E")
	light.light_energy = 0.52
	light.omni_range = radius * 2.6
	light.position = Vector3(0, 0.6, 0)
	hazard_root.add_child(light)
	return { "position": position, "radius": radius, "node": hazard_root, "phase": rng.randf_range(0.0, TAU) }

func _spawn_sentry(position: Vector3, index: int) -> Dictionary:
	var node := Node3D.new()
	node.name = "Sentry%d" % index
	node.position = position + Vector3(0, 0.92, 0)
	sentry_root.add_child(node)
	var sentry_model := _add_scene_model(QUATERNIUS_MODEL_PATHS["enemy_small"], node, Vector3(0, -0.18, 0), 0.58, PI, materials["sentry_armor"])
	if sentry_model:
		sentry_model.name = "ImportedSeekerBody"
	else:
		var body := _make_box(Vector3(0.72, 0.54, 0.82), materials["sentry_armor"], Vector3(0, -0.08, 0), node)
		body.name = "SeekerCombatBody"
		_make_sphere(0.22, materials["sentry"], Vector3(0, 0.28, -0.28), node).name = "SeekerSensor"
	var wing_left := _make_box(Vector3(0.44, 0.055, 0.18), materials["sentry"], Vector3(-0.52, 0.08, 0.02), node)
	wing_left.name = "SeekerLeftEmitter"
	var wing_right := _make_box(Vector3(0.44, 0.055, 0.18), materials["sentry"], Vector3(0.52, 0.08, 0.02), node)
	wing_right.name = "SeekerRightEmitter"
	var sentry_light := OmniLight3D.new()
	sentry_light.light_color = Color("#FF4D5E")
	sentry_light.light_energy = 0.36
	sentry_light.omni_range = 2.1
	node.add_child(sentry_light)
	var patrol_angle := rng.randf_range(0.0, TAU)
	return {
		"position": position,
		"home": position,
		"velocity": Vector2(cos(patrol_angle), sin(patrol_angle)) * rng.randf_range(0.16, 0.3),
		"radius": 0.62,
		"node": node,
		"speed": rng.randf_range(0.82, 1.12),
		"health": SENTRY_HEALTH,
		"alive": true,
		"stunTimer": 0.0,
		"attackCooldown": rng.randf_range(0.25, 0.65),
		"alertRadius": SENTRY_ALERT_RADIUS + rng.randf_range(-0.6, 0.7),
		"patrolPhase": patrol_angle,
		"aiState": "patrol"
	}

func _spawn_physics_prop(position: Vector3, index: int) -> Dictionary:
	var node := Node3D.new()
	node.name = "PushableCargo%d" % index
	node.position = position + Vector3(0, 0.28, 0)
	objective_root.add_child(node)
	var crate := _add_scene_model(QUATERNIUS_MODEL_PATHS["pickup_crate"], node, Vector3(0, -0.08, 0), rng.randf_range(0.42, 0.52), rng.randf_range(0.0, TAU), materials["physics_prop"])
	if crate:
		crate.name = "PhysicalCargoModel"
	else:
		_make_box(Vector3(0.64, 0.48, 0.64), materials["physics_prop"], Vector3(0, -0.03, 0), node)
	var trim := _make_box(Vector3(0.52, 0.045, 0.08), materials["accent"], Vector3(0, 0.18, -0.32), node)
	trim.name = "CargoLightStrip"
	var light := OmniLight3D.new()
	light.light_color = Color("#FFD166")
	light.light_energy = 0.22
	light.omni_range = 1.7
	light.position = Vector3(0, 0.35, 0)
	node.add_child(light)
	return {
		"id": "cargo-%d" % index,
		"position": position,
		"velocity": Vector2.ZERO,
		"radius": PHYSICS_PROP_RADIUS,
		"mass": rng.randf_range(1.0, 1.45),
		"node": node
	}

func _spawn_extraction_gate(target: Vector3) -> Dictionary:
	var node := Node3D.new()
	node.name = "ExtractionBreach"
	node.position = target
	objective_root.add_child(node)
	_add_scene_model(QUATERNIUS_MODEL_PATHS["base_large"], node, Vector3(0, 0.06, 0), 0.28, 0.0)
	_add_scene_model(QUATERNIUS_MODEL_PATHS["connector"], node, Vector3(0, 0.26, 0), 0.5, PI / 2.0)
	var ship := _add_scene_model(QUATERNIUS_MODEL_PATHS["spaceship"], node, Vector3(0, 0.95, 0), 0.12, PI)
	if ship:
		ship.name = "ExitMarkerShip"
	var ring_mesh := TorusMesh.new()
	ring_mesh.inner_radius = 0.72
	ring_mesh.outer_radius = 0.92
	ring_mesh.ring_segments = 80
	var ring := MeshInstance3D.new()
	ring.name = "BreachRing"
	ring.mesh = ring_mesh
	ring.material_override = materials["edge"]
	ring.position = Vector3(0, 0.34, 0)
	ring.rotation.x = PI / 2.0
	node.add_child(ring)
	var light := OmniLight3D.new()
	light.light_color = Color("#73FBD3")
	light.light_energy = 1.1
	light.omni_range = 4.2
	light.position = Vector3(0, 0.78, 0)
	node.add_child(light)
	return { "position": target, "target": target, "node": node, "targetNode": node, "charge": 0.0, "radius": 1.55 }

func _update_play(delta: float) -> void:
	elapsed_seconds += delta
	threat_grace_remaining = max(0.0, threat_grace_remaining - delta)
	_update_players(delta)
	_update_physics_props(delta)
	_update_projectiles(delta)
	_update_supply_caches(delta)
	_update_sentries(delta)
	_update_hazards(delta)
	_update_mission(delta)
	if MAX_TIME_SECONDS - elapsed_seconds <= 0.0:
		_finish_game(false, "Demo window closed before the prototype shipped.")
	elif _living_players() == 0:
		_finish_game(false, "All joined operators were downed.")

func _update_players(delta: float) -> void:
	for player in players:
		if not bool(player["joined"]) or player["energy"] <= 0.0:
			continue
		player["hitCooldown"] = max(0.0, player["hitCooldown"] - delta)
		player["hazardTick"] = max(0.0, player["hazardTick"] - delta)
		player["weaponCooldown"] = max(0.0, float(player["weaponCooldown"]) - delta)
		var slot := String(player["slot"]).to_lower()
		var direction: Vector3 = _camera_relative_input(slot)
		var target_velocity: Vector3 = direction * PLAYER_SPEED
		var move_velocity: Vector3 = player["moveVelocity"]
		var acceleration := PLAYER_ACCELERATION if direction.length() > 0.01 else PLAYER_DECELERATION
		move_velocity = move_velocity.move_toward(target_velocity, acceleration * delta)
		var previous_position: Vector3 = player["position"]
		var resolved_motion := _resolve_player_motion(previous_position, previous_position + move_velocity * delta, move_velocity)
		var position: Vector3 = resolved_motion["position"]
		move_velocity = resolved_motion["velocity"]
		_push_physics_props(position, move_velocity, PLAYER_RADIUS, 3.1)
		player["position"] = position
		player["velocity"] = move_velocity
		player["moveVelocity"] = move_velocity
		var speed_ratio: float = clamp(move_velocity.length() / PLAYER_SPEED, 0.0, 1.0)
		var bob: float = sin(Time.get_ticks_msec() / 80.0) * 0.05 * speed_ratio
		player["node"].position = position + Vector3(0, bob, 0)
		player["stridePhase"] = float(player["stridePhase"]) + delta * lerp(3.0, 9.5, speed_ratio)
		_animate_player_movement(player, speed_ratio, delta)
		if move_velocity.length() > 0.15:
			var look_direction := Vector3(move_velocity.x, 0.0, move_velocity.z).normalized()
			player["aimDirection"] = look_direction
			player["node"].look_at(player["node"].position + look_direction, Vector3.UP)
			var local_direction: Vector3 = player["node"].global_transform.basis.inverse() * look_direction
			player["node"].rotation.z = lerp_angle(player["node"].rotation.z, -local_direction.x * 0.16, min(1.0, delta * 8.0))
		else:
			player["node"].rotation.z = lerp_angle(player["node"].rotation.z, 0.0, min(1.0, delta * 7.0))
		var action := "%s_action" % slot
		if Input.is_action_just_pressed(action):
			_fire_player_weapon(player)
		_update_weapon_visual(player, delta)
		if threat_grace_remaining <= 0.0 and _point_in_hazard(position) and player["hazardTick"] <= 0.0:
			player["energy"] = max(0.0, player["energy"] - (6.0 if active_player_count == 1 else 8.0))
			player["hazardTick"] = 0.6
			player_stats[player["slot"]]["damageTaken"] += 1
			team_score = max(0, team_score - 85)
			_play_sound("glitch")
			_flash_screen(Color(1.0, 0.18, 0.24, 0.18), 0.24)
			_spawn_burst(position + Vector3(0, 0.35, 0), Color("#FF4D5E"), 0.75)

func _fire_player_weapon(player: Dictionary) -> bool:
	if float(player["weaponCooldown"]) > 0.0 or player["energy"] <= 0.0:
		return false
	var position: Vector3 = player["position"]
	var direction: Vector3 = player.get("aimDirection", camera_heading)
	direction.y = 0.0
	if direction.length() <= 0.05:
		direction = camera_heading
		direction.y = 0.0
	if direction.length() <= 0.05:
		direction = Vector3(0.0, 0.0, -1.0)
	direction = direction.normalized()
	var target := _nearest_sentry_in_arc(position, direction, PLAYER_WEAPON_RANGE)
	if not target.is_empty():
		var to_target: Vector3 = target["position"] - position
		to_target.y = 0.0
		if to_target.length() > 0.05:
			direction = to_target.normalized()
	player["aimDirection"] = direction
	player["weaponCooldown"] = PLAYER_WEAPON_COOLDOWN
	var start_position := _weapon_muzzle_global_position(player, direction)
	var projectile_node := Node3D.new()
	projectile_node.name = "PulseShot"
	projectile_node.position = start_position
	fx_root.add_child(projectile_node)
	var bolt := _make_sphere(PLAYER_WEAPON_RADIUS, materials["weapon_charge"], Vector3.ZERO, projectile_node)
	bolt.name = "PulseBoltCore"
	var tracer := _make_box(Vector3(0.035, 0.035, 0.46), materials["weapon_charge"], Vector3(0, 0, 0.21), projectile_node)
	tracer.name = "PulseBoltTracer"
	projectile_node.look_at(start_position + direction, Vector3.UP)
	var light := OmniLight3D.new()
	light.name = "PulseShotLight"
	light.light_color = Color("#78E7FF")
	light.light_energy = 0.62
	light.omni_range = 1.35
	projectile_node.add_child(light)
	projectiles.append({
		"node": projectile_node,
		"position": start_position,
		"velocity": direction * PLAYER_WEAPON_SPEED,
		"radius": PLAYER_WEAPON_RADIUS,
		"damage": PLAYER_WEAPON_DAMAGE,
		"ttl": PLAYER_WEAPON_RANGE / PLAYER_WEAPON_SPEED,
		"ownerSlot": player["slot"],
		"color": Color("#78E7FF")
	})
	_play_sound("click")
	return true

func _weapon_muzzle_global_position(player: Dictionary, direction: Vector3) -> Vector3:
	var player_node: Node3D = player["node"]
	var emitter := _find_named_node(player_node, "WeaponEmitter") as Node3D
	if emitter:
		return emitter.global_position + direction * 0.14
	var base_position: Vector3 = player["position"]
	return base_position + direction * (PLAYER_RADIUS + 0.38) + Vector3(0.0, 0.78, 0.0)

func _update_weapon_visual(player: Dictionary, delta: float) -> void:
	var weapon := _find_named_node(player["node"], "PulseCarbine") as Node3D
	if not weapon:
		return
	var ready := 1.0 if float(player["weaponCooldown"]) <= 0.0 else 0.0
	var target_scale := Vector3.ONE * (1.0 + ready * 0.035)
	weapon.scale = weapon.scale.lerp(target_scale, min(1.0, delta * 10.0))
	var emitter := _find_named_node(weapon, "WeaponEmitter") as MeshInstance3D
	if emitter:
		emitter.scale = emitter.scale.lerp(Vector3.ONE * (1.0 + ready * 0.18), min(1.0, delta * 8.0))

func _update_projectiles(delta: float) -> void:
	for index in range(projectiles.size() - 1, -1, -1):
		var projectile := projectiles[index]
		var position: Vector3 = projectile["position"]
		var velocity: Vector3 = projectile["velocity"]
		var next_position := position + velocity * delta
		var radius: float = float(projectile["radius"])
		projectile["ttl"] = float(projectile["ttl"]) - delta
		var impact := false
		if projectile["ttl"] <= 0.0 or _collides_with_static(next_position, radius):
			impact = true
		else:
			for sentry in sentries:
				if not bool(sentry.get("alive", true)):
					continue
				if _flat_distance(next_position, sentry["position"]) <= radius + float(sentry["radius"]):
					_damage_sentry(sentry, float(projectile["damage"]), String(projectile["ownerSlot"]))
					impact = true
					break
		if impact:
			_despawn_projectile(index, position, projectile.get("color", Color("#73FBD3")))
			continue
		projectile["position"] = next_position
		var node: Node3D = projectile["node"]
		if node and is_instance_valid(node):
			node.position = next_position
			if velocity.length() > 0.1:
				node.look_at(next_position + velocity.normalized(), Vector3.UP)
		projectiles[index] = projectile

func _despawn_projectile(index: int, position: Vector3, color: Color) -> void:
	if index < 0 or index >= projectiles.size():
		return
	var projectile := projectiles[index]
	var node: Node3D = projectile.get("node")
	if node and is_instance_valid(node):
		node.queue_free()
	projectiles.remove_at(index)
	_spawn_burst(position, color, 0.42)

func _nearest_sentry_in_arc(position: Vector3, direction: Vector3, max_distance: float) -> Dictionary:
	var nearest := {}
	var nearest_distance := max_distance
	for sentry in sentries:
		if not bool(sentry.get("alive", true)):
			continue
		var offset: Vector3 = sentry["position"] - position
		offset.y = 0.0
		var distance := offset.length()
		if distance <= 0.01 or distance > nearest_distance:
			continue
		var aim_dot := direction.normalized().dot(offset.normalized())
		if aim_dot < 0.18:
			continue
		if _line_blocked_by_static(position, sentry["position"], PLAYER_WEAPON_RADIUS):
			continue
		nearest = sentry
		nearest_distance = distance
	return nearest

func _line_blocked_by_static(from_position: Vector3, to_position: Vector3, radius: float) -> bool:
	var delta := to_position - from_position
	delta.y = 0.0
	var distance := delta.length()
	if distance <= 0.01:
		return false
	var direction := delta / distance
	var steps: int = max(1, int(ceil(distance / 0.42)))
	for step in range(1, steps):
		var sample := from_position + direction * (float(step) / float(steps) * distance)
		if _collides_with_static(sample, radius):
			return true
	return false

func _damage_sentry(sentry: Dictionary, damage: float, owner_slot: String) -> void:
	if not bool(sentry.get("alive", true)):
		return
	var health: float = max(0.0, float(sentry.get("health", SENTRY_HEALTH)) - damage)
	sentry["health"] = health
	sentry["stunTimer"] = max(float(sentry.get("stunTimer", 0.0)), SENTRY_STUN_DURATION)
	_spawn_burst(sentry["position"] + Vector3(0, 0.74, 0), Color("#FFD166"), 0.52)
	if health > 0.0:
		_play_sound("switch")
		return
	sentry["alive"] = false
	sentry["velocity"] = Vector2.ZERO
	var node: Node3D = sentry["node"]
	if node and is_instance_valid(node):
		node.visible = false
	team_score += 520
	if player_stats.has(owner_slot):
		player_stats[owner_slot]["score"] += 520
		player_stats[owner_slot]["mobDefeats"] += 1
	_play_sound("select")
	_flash_screen(Color(1.0, 0.82, 0.22, 0.12), 0.16)

func _update_supply_caches(delta: float) -> void:
	for cache in supply_caches:
		if cache["collected"]:
			continue
		cache["node"].rotation.y += delta * 1.25
		cache["node"].position.y = 0.24 + sin(Time.get_ticks_msec() / 280.0 + float(abs(hash(cache["id"])) % 70)) * 0.035
		for player in _joined_players():
			if player["energy"] <= 0.0:
				continue
			if _flat_distance(player["position"], cache["position"]) <= float(cache["radius"]):
				cache["collected"] = true
				cache["node"].visible = false
				player["energy"] = min(100.0, float(player["energy"]) + 22.0)
				team_score += 260
				player_stats[player["slot"]]["pickups"] += 1
				player_stats[player["slot"]]["score"] += 260
				_play_sound("drop")
				if player["energy"] < 45.0:
					_show_story_event("Supply cache recovered", "Energy restored. Push toward the next objective.")
				_spawn_burst(cache["position"] + Vector3(0, 0.45, 0), Color("#78E7FF"), 0.85)
				_flash_screen(Color(0.18, 0.72, 1.0, 0.12), 0.22)
				break

func _update_physics_props(delta: float) -> void:
	for prop in physics_props:
		var position: Vector3 = prop["position"]
		var velocity: Vector2 = prop["velocity"]
		if velocity.length() > 0.02:
			velocity = velocity.move_toward(Vector2.ZERO, PHYSICS_PROP_FRICTION * delta)
		else:
			velocity = Vector2.ZERO

		var desired := position + Vector3(velocity.x, 0.0, velocity.y) * delta
		var radius: float = float(prop["radius"])
		var resolved := position
		var x_candidate := Vector3(clamp(desired.x, ARENA_RECT.position.x + radius, ARENA_RECT.end.x - radius), 0.0, resolved.z)
		if _collides_with_static(x_candidate, radius):
			velocity.x = 0.0
		else:
			resolved.x = x_candidate.x
		var z_candidate := Vector3(resolved.x, 0.0, clamp(desired.z, ARENA_RECT.position.y + radius, ARENA_RECT.end.y - radius))
		if _collides_with_static(z_candidate, radius):
			velocity.y = 0.0
		else:
			resolved.z = z_candidate.z

		resolved = _resolve_static_overlap(resolved, radius)
		prop["position"] = resolved
		prop["velocity"] = velocity
		var node: Node3D = prop["node"]
		node.position = resolved + Vector3(0, 0.28, 0)
		node.rotation.y += velocity.length() * delta * 1.2
		var strip := node.get_node_or_null("CargoLightStrip") as MeshInstance3D
		if strip:
			strip.scale.x = 1.0 + clamp(velocity.length() / 5.0, 0.0, 0.35)

func _update_sentries(delta: float) -> void:
	for sentry in sentries:
		if not bool(sentry.get("alive", true)):
			continue
		var position: Vector3 = sentry["position"]
		var velocity: Vector2 = sentry["velocity"]
		sentry["attackCooldown"] = max(0.0, float(sentry.get("attackCooldown", 0.0)) - delta)
		sentry["stunTimer"] = max(0.0, float(sentry.get("stunTimer", 0.0)) - delta)
		if float(sentry["stunTimer"]) > 0.0:
			velocity = velocity.move_toward(Vector2.ZERO, 8.0 * delta)
			sentry["velocity"] = velocity
			var stunned_node: Node3D = sentry["node"]
			stunned_node.position = position + Vector3(0, 0.92 + sin(Time.get_ticks_msec() / 70.0) * 0.04, 0)
			continue
		if threat_grace_remaining > 0.0:
			velocity = velocity.move_toward(Vector2.ZERO, 4.0 * delta)
			sentry["velocity"] = velocity
			sentry["aiState"] = "dormant"
			var dormant_node: Node3D = sentry["node"]
			dormant_node.position = position + Vector3(0, 0.92 + sin(Time.get_ticks_msec() / 260.0 + position.x) * 0.04, 0)
			continue
		var target_player := _nearest_living_player(position, float(sentry["alertRadius"]))
		var desired_direction := Vector2.ZERO
		var ai_state := "patrol"
		if not target_player.is_empty():
			var target_position: Vector3 = target_player["position"]
			desired_direction = Vector2(target_position.x - position.x, target_position.z - position.z)
			ai_state = "chase"
		else:
			sentry["patrolPhase"] = float(sentry["patrolPhase"]) + delta * 0.72
			var home: Vector3 = sentry["home"]
			var patrol_target := home + Vector3(
				cos(float(sentry["patrolPhase"])) * SENTRY_PATROL_RADIUS,
				0.0,
				sin(float(sentry["patrolPhase"]) * 1.35) * SENTRY_PATROL_RADIUS * 0.72
			)
			desired_direction = Vector2(patrol_target.x - position.x, patrol_target.z - position.z)
			if _flat_distance(position, home) > SENTRY_PATROL_RADIUS * 1.8:
				desired_direction = Vector2(home.x - position.x, home.z - position.z)
				ai_state = "return"

		if desired_direction.length() > 0.01:
			desired_direction = desired_direction.normalized()
			desired_direction = _steer_around_blockers(position, desired_direction, float(sentry["radius"]))
		var desired_velocity := desired_direction * float(sentry["speed"]) * (0.95 if ai_state == "chase" else 0.58)
		velocity = velocity.move_toward(desired_velocity, 4.4 * delta)
		var resolved_motion := _resolve_sentry_motion(position, velocity, float(sentry["radius"]), delta)
		position = resolved_motion["position"]
		velocity = resolved_motion["velocity"]
		position = _resolve_dynamic_overlap_with_sentries(sentry, position, float(sentry["radius"]))
		sentry["position"] = position
		sentry["velocity"] = velocity
		sentry["aiState"] = ai_state
		sentry["node"].position = position + Vector3(0, 0.92 + sin(Time.get_ticks_msec() / 230.0 + position.x) * 0.08, 0)
		if velocity.length() > 0.1:
			sentry["node"].look_at(sentry["node"].position + Vector3(velocity.x, 0, velocity.y), Vector3.UP)
		for player in _joined_players():
			if player["energy"] <= 0.0 or player["hitCooldown"] > 0.0 or float(sentry["attackCooldown"]) > 0.0:
				continue
			if _flat_distance(player["position"], position) <= max(SENTRY_ATTACK_RANGE, PLAYER_RADIUS + float(sentry["radius"]) * 0.72):
				sentry["attackCooldown"] = SENTRY_ATTACK_COOLDOWN
				player["energy"] = max(0.0, player["energy"] - (10.0 if active_player_count == 1 else 13.0))
				player["hitCooldown"] = 0.95
				player_stats[player["slot"]]["damageTaken"] += 1
				team_score = max(0, team_score - 105)
				_play_sound("error")
				_flash_screen(Color(1.0, 0.12, 0.18, 0.22), 0.32)
				_spawn_burst(player["position"] + Vector3(0, 0.65, 0), Color("#FF4D5E"), 0.9)
				if story_toast_timer <= 0.0:
					_show_story_event("Seeker strike", "Return fire with E or Enter, then move behind cargo to break pursuit.")

func _update_hazards(_delta: float) -> void:
	for hazard in hazards:
		var node = hazard["node"]
		node.scale = Vector3.ONE * (1.0 + sin(Time.get_ticks_msec() / 320.0 + hazard["phase"]) * 0.05)

func _update_mission(delta: float) -> void:
	match mission_index:
		0:
			_update_core_mission(delta)
		1:
			_update_relay_mission(delta)
		2:
			_update_extraction_mission(delta)
		_:
			_finish_game(true, "Extraction complete.")

func _update_relay_mission(_delta: float) -> void:
	var activated := 0
	for index in range(relay_pads.size()):
		var pad := relay_pads[index]
		if pad["complete"]:
			activated += 1
			continue
		if _pad_has_player(pad):
			pad["complete"] = true
			relay_progress[index] = sync_required
			activated += 1
			team_score += 1100
			_award_all_joined("assists", 1)
			pad["node"].scale = Vector3.ONE * 1.12
			_play_sound("switch")
			_spawn_burst(pad["position"] + Vector3(0, 0.45, 0), Color("#73FBD3") if index == 0 else Color("#7CFF6B"), 1.0)
			_show_objective_banner("Gate Framed", "%s principle locked. %d/%d online." % [String(pad["id"]).capitalize(), activated, relay_pads.size()], Color("#FFD166"))
	mission_status = "Principle gates framed: %d/%d" % [activated, relay_pads.size()]
	if activated >= relay_pads.size():
		_complete_mission("Route framed. Move to the demo pad.")

func _update_core_mission(delta: float) -> void:
	var remaining := 0
	for core in data_cores:
		if core["collected"]:
			continue
		remaining += 1
		core["node"].rotation.y += delta * 1.8
		for player in _joined_players():
			if player["energy"] <= 0.0:
				continue
			var action := "%s_action" % String(player["slot"]).to_lower()
			var distance := _flat_distance(player["position"], core["position"])
			if distance <= 0.82 or (distance <= PLAYER_INTERACT_RADIUS and Input.is_action_just_pressed(action)):
				core["collected"] = true
				core["node"].visible = false
				remaining -= 1
				team_score += 800
				player_stats[player["slot"]]["score"] += 800
				player_stats[player["slot"]]["pickups"] += 1
				player_stats[player["slot"]]["objectives"] += 1
				_play_sound("select")
				_spawn_burst(core["position"] + Vector3(0, 0.5, 0), Color("#FFD166"), 0.8)
				break
	mission_status = "Idea sparks remaining: %d" % max(remaining, 0)
	if remaining <= 0:
		_complete_mission("Spark pool ready. Frame the route.")

func _update_extraction_mission(delta: float) -> void:
	var arrived_count := 0
	for player in _joined_players():
		if player["energy"] > 0.0 and _flat_distance(player["position"], drone["position"]) <= float(drone.get("radius", 1.55)):
			arrived_count += 1
	var required := active_player_count
	if arrived_count > 0:
		drone["charge"] = min(1.0, float(drone["charge"]) + delta * (0.95 if arrived_count >= required else 0.42))
		team_score += int((130.0 + arrived_count * 70.0) * delta)
	else:
		drone["charge"] = max(0.0, float(drone["charge"]) - delta * 0.4)
	drone["node"].scale = Vector3.ONE * (1.0 + float(drone["charge"]) * 0.12)
	mission_status = "Prototype demo: %d/%d on pad" % [arrived_count, required]
	if arrived_count > 0 and story_toast_timer <= 0.0 and float(drone["charge"]) > 0.35:
		_show_story_event("Prototype demo charging", "Hold the demo pad. Blockers cannot stop the share once the meter fills.")
	if arrived_count >= required and float(drone["charge"]) >= 1.0:
		_award_all_joined("assists", 1)
		_complete_mission("Prototype shipped.")

func _pad_has_player(pad: Dictionary) -> bool:
	for player in _joined_players():
		if player["energy"] > 0.0 and _flat_distance(player["position"], pad["position"]) <= pad["radius"]:
			return true
	return false

func _complete_mission(message: String) -> void:
	var completed_index := mission_index
	var completed_name: String = MISSION_NAMES[min(completed_index, MISSION_NAMES.size() - 1)]
	team_score += 1800 if active_player_count == 1 else 2300
	_award_all_joined("score", 900)
	_award_all_joined("objectives", 1)
	mission_index += 1
	mission_status = message
	_play_sound("confirm")
	_show_objective_banner("%s Complete" % completed_name, message, Color("#73FBD3"))
	_flash_screen(Color(0.25, 1.0, 0.78, 0.16), 0.3)
	var completion_position := Vector3.ZERO
	if completed_index == 0 and data_cores.size() > 0:
		completion_position = data_cores[0]["position"]
		_spawn_burst(completion_position + Vector3(0, 0.5, 0), Color("#FFD166"), 1.25)
	elif completed_index == 1 and relay_pads.size() > 0:
		completion_position = relay_pads[0]["position"]
		_spawn_burst(completion_position + Vector3(0, 0.5, 0), Color("#73FBD3"), 1.25)
	elif not drone.is_empty():
		completion_position = drone["position"]
		_spawn_burst(completion_position + Vector3(0, 0.55, 0), Color("#73FBD3"), 1.35)
	_spawn_phase_complete_wave(completion_position, Color("#73FBD3") if completed_index != 0 else Color("#FFD166"))
	if mission_index >= MISSION_NAMES.size():
		_finish_game(true, "Prototype shipped.")
	else:
		_start_intermission_scene(completed_name, message)

func _award_all_joined(field: String, amount: int) -> void:
	for player in _joined_players():
		player_stats[player["slot"]][field] += amount

func _finish_game(success: bool, message: String) -> void:
	if finished:
		return
	finished = true
	phase = "finished"
	final_message = message
	if success:
		team_score += int(max(0.0, MAX_TIME_SECONDS - elapsed_seconds) * (14.0 + active_player_count * 4.0))
		_play_sound("confirm")
		_show_objective_banner("Prototype Shipped", "Result saved to Player Passport.", Color("#73FBD3"))
		_show_phase_scene("Results Scene", "Prototype shipped. Result is being saved to Player Passport.", Color("#73FBD3"), 0.0, "squares")
		_flash_screen(Color(0.25, 1.0, 0.78, 0.18), 0.45)
	else:
		_play_sound("error")
		_show_objective_banner("Run Failed", message, Color("#FF4D5E"))
		_show_phase_scene("Results Scene", message, Color("#FF4D5E"), 0.0, "squares")
		_flash_screen(Color(1.0, 0.1, 0.16, 0.22), 0.45)
	result_label.visible = true
	_submit_result(success)

func _submit_result(success: bool) -> void:
	if submitted_result:
		return
	submitted_result = true
	if callback_url.is_empty():
		final_message += "\nDemo mode. No callback URL was provided."
		return
	var payload := _build_result_payload(success)
	if not callback_secret.is_empty():
		payload["signature"] = _sign_payload(payload, callback_secret)
	var request := HTTPRequest.new()
	add_child(request)
	request.request_completed.connect(_on_result_submitted)
	var error := request.request(
		callback_url,
		["Content-Type: application/json"],
		HTTPClient.METHOD_POST,
		JSON.stringify(payload)
	)
	if error != OK:
		final_message += "\nCallback request failed to start: %s" % error

func _build_result_payload(success: bool) -> Dictionary:
	var duration := int(max(1.0, elapsed_seconds))
	var results: Array = []
	for player in _joined_players():
		var stats: Dictionary = player_stats.get(player["slot"], {})
		results.append({
			"slot": player["slot"],
			"playerId": player["playerId"],
			"displayName": player["displayName"],
			"score": max(int(stats.get("score", 0)) + team_score, 0),
			"result": "win" if success else "finished",
			"telemetry": {
				"objectives": stats.get("objectives", 0),
				"assists": stats.get("assists", 0),
				"pickups": stats.get("pickups", 0),
				"damageTaken": stats.get("damageTaken", 0),
				"mobDefeats": stats.get("mobDefeats", 0),
				"joinedDuringCountdown": player["slot"] == "P2" and not payload_by_slot.has("P2"),
				"avatar": player["payload"].get("avatarRuntime", {})
			}
		})
	return {
		"idempotencyKey": "%s-%d-%d" % [launch_payload.get("gameSessionId", "local"), Time.get_unix_time_from_system(), rng.randi_range(1000, 9999)],
		"cabinetId": launch_payload.get("cabinetId", "DEMO-CABINET"),
		"siteId": launch_payload.get("siteId", "LOCAL-DEMO"),
		"gameId": launch_payload.get("gameId", GAME_ID),
		"gameSessionId": launch_payload.get("gameSessionId", "demo"),
		"mode": "co-op" if active_player_count > 1 else "solo",
		"startedAt": started_at_iso,
		"endedAt": _utc_now_iso(),
		"durationSeconds": duration,
		"players": results,
		"telemetry": {
			"source": "nexus-relay-godot-3d",
			"teamScore": team_score,
			"activePlayerCount": active_player_count,
			"completedMissions": min(mission_index, MISSION_NAMES.size()),
			"totalMissions": MISSION_NAMES.size(),
			"generationSeed": generation_seed,
			"droneChargePercent": int(round(float(drone.get("charge", 0.0)) * 100.0))
		},
		"nonce": "%d-%d" % [Time.get_ticks_usec(), rng.randi()]
	}

func _on_result_submitted(_result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code >= 200 and response_code < 300:
		final_message += "\nResult saved to Player Passport."
	else:
		final_message += "\nResult callback failed (%d): %s" % [response_code, body.get_string_from_utf8()]
	_update_hud()

func _update_attract_camera(delta: float) -> void:
	if not camera:
		return
	var orbit := attract_demo_time * 0.32
	var focus := Vector3(sin(orbit) * 2.2, 1.25, 0.3 + cos(orbit * 0.8) * 1.0)
	var desired_position := focus + Vector3(cos(orbit) * 5.8, 2.75, sin(orbit) * 5.8 + 2.4)
	desired_position = _safe_camera_position(desired_position, focus)
	camera_focus = camera_focus.lerp(focus, min(1.0, delta * 2.6))
	camera.position = camera.position.lerp(desired_position, min(1.0, delta * 2.4))
	camera.look_at(camera_focus, Vector3.UP)

func _update_camera(delta: float) -> void:
	if not camera:
		return
	var joined := _joined_players()
	if joined.is_empty():
		var idle_focus := Vector3(0, 1.0, 4.0)
		camera_focus = camera_focus.lerp(idle_focus, min(1.0, delta * 3.0))
		camera.position = camera.position.lerp(camera_focus + Vector3(0, 2.4, 6.2), min(1.0, delta * 2.8))
		camera.look_at(camera_focus, Vector3.UP)
		return

	var target := Vector3.ZERO
	var average_velocity := Vector3.ZERO
	for player in joined:
		target += player["position"]
		average_velocity += player["moveVelocity"]
	target /= joined.size()
	average_velocity /= joined.size()

	var spread := 0.0
	for player in joined:
		spread = max(spread, _flat_distance(player["position"], target))

	var desired_position := Vector3.ZERO
	if joined.size() == 1:
		var player: Dictionary = joined[0]
		var velocity: Vector3 = player["moveVelocity"]
		if velocity.length() > 0.2:
			var desired_heading := Vector3(velocity.x, 0.0, velocity.z).normalized()
			camera_heading = camera_heading.lerp(desired_heading, min(1.0, delta * 2.4)).normalized()
		var speed_ratio: float = clamp(velocity.length() / PLAYER_SPEED, 0.0, 1.0)
		var desired_focus: Vector3 = player["position"] + camera_heading * (0.95 + speed_ratio * 0.45) + Vector3(0, 1.05, 0)
		camera_focus = camera_focus.lerp(desired_focus, min(1.0, delta * 5.0))
		desired_position = camera_focus - camera_heading * 6.9 + Vector3(0, 2.55, 0)
	else:
		if average_velocity.length() > 0.25:
			var group_heading := Vector3(average_velocity.x, 0.0, average_velocity.z).normalized()
			camera_heading = camera_heading.lerp(group_heading, min(1.0, delta * 1.6)).normalized()
		var group_focus := target + camera_heading * 0.45 + Vector3(0, 1.08, 0)
		camera_focus = camera_focus.lerp(group_focus, min(1.0, delta * 4.2))
		var camera_distance: float = clamp(7.2 + spread * 0.62, 7.2, 10.4)
		var camera_height: float = clamp(2.9 + spread * 0.2, 2.9, 4.6)
		var side_offset: Vector3 = Vector3(camera_heading.z, 0.0, -camera_heading.x) * clamp(1.0 + spread * 0.14, 1.0, 1.8)
		desired_position = camera_focus - camera_heading * camera_distance + side_offset + Vector3(0, camera_height, 0)

	desired_position = _safe_camera_position(desired_position, camera_focus)
	camera.position = camera.position.lerp(desired_position, min(1.0, delta * 4.2))
	camera.look_at(camera_focus, Vector3.UP)

func _safe_camera_position(desired_position: Vector3, focus: Vector3) -> Vector3:
	var safe := desired_position
	safe.x = clamp(safe.x, ARENA_RECT.position.x + 1.15, ARENA_RECT.end.x - 1.15)
	safe.z = clamp(safe.z, ARENA_RECT.position.y + 1.15, ARENA_RECT.end.y - 1.15)
	safe.y = clamp(safe.y, 2.15, 4.8)
	if not _collides_with_static(Vector3(safe.x, 0.0, safe.z), 0.45):
		return safe
	var candidates := [
		focus + Vector3(0.0, 2.8, 5.6),
		focus + Vector3(2.6, 2.8, 5.1),
		focus + Vector3(-2.6, 2.8, 5.1),
		focus + Vector3(0.0, 3.4, 3.6),
		focus + Vector3(0.0, 2.8, -5.1)
	]
	for candidate in candidates:
		var fallback: Vector3 = candidate
		fallback.x = clamp(fallback.x, ARENA_RECT.position.x + 1.15, ARENA_RECT.end.x - 1.15)
		fallback.z = clamp(fallback.z, ARENA_RECT.position.y + 1.15, ARENA_RECT.end.y - 1.15)
		fallback.y = clamp(fallback.y, 2.25, 4.8)
		if not _collides_with_static(Vector3(fallback.x, 0.0, fallback.z), 0.45):
			return fallback
	return Vector3(focus.x, clamp(focus.y + 3.2, 2.6, 4.6), focus.z + 5.2)

func _animate_scene(_delta: float) -> void:
	var time := Time.get_ticks_msec() / 1000.0
	for core in data_cores:
		if not core["collected"]:
			core["node"].position.y = 0.42 + sin(time * 2.2 + float(abs(hash(core["id"])) % 100)) * 0.08
	for cache in supply_caches:
		if not cache["collected"]:
			cache["node"].rotation.y += 0.008
	for pad in relay_pads:
		var beacon = pad.get("beacon")
		if beacon:
			beacon.scale = Vector3.ONE * (1.0 + sin(time * 4.0 + float(abs(hash(pad["id"])) % 20)) * 0.1)
	if not drone.is_empty() and drone.has("node"):
		drone["node"].rotation.y += 0.018

func _sign_payload(payload: Dictionary, secret: String) -> String:
	var canonical := JSON.stringify(_sort_value(payload))
	var hmac := HMACContext.new()
	var error := hmac.start(HashingContext.HASH_SHA256, secret.to_utf8_buffer())
	if error != OK:
		return ""
	hmac.update(canonical.to_utf8_buffer())
	return hmac.finish().hex_encode()

func _sort_value(value):
	match typeof(value):
		TYPE_DICTIONARY:
			var sorted := {}
			var keys: Array = value.keys()
			keys.sort()
			for key in keys:
				if String(key) == "signature":
					continue
				sorted[key] = _sort_value(value[key])
			return sorted
		TYPE_ARRAY:
			var sorted_array := []
			for item in value:
				sorted_array.append(_sort_value(item))
			return sorted_array
		_:
			return value

func _create_hud() -> void:
	hud_layer = CanvasLayer.new()
	hud_layer.layer = 8
	add_child(hud_layer)
	screen_flash_rect = ColorRect.new()
	screen_flash_rect.name = "ScreenFeedbackFlash"
	screen_flash_rect.color = Color(0, 0, 0, 0)
	screen_flash_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	screen_flash_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	screen_flash_rect.visible = false
	hud_layer.add_child(screen_flash_rect)
	title_label = _make_label(Vector2(28, 18), 28, Color("#F7FBFF"))
	countdown_label = _make_label(Vector2(28, 54), 20, Color("#73FBD3"))
	mission_label = _make_label(Vector2(28, 88), 18, Color("#FFD166"))
	status_label = _make_label(Vector2(28, 118), 16, Color("#B8C3D9"))
	score_label = _make_label(Vector2(980, 22), 22, Color("#F7FBFF"))
	timer_label = _make_label(Vector2(980, 54), 18, Color("#FFD166"))
	p1_label = _make_label(Vector2(28, 664), 16, Color("#F7FBFF"))
	p2_label = _make_label(Vector2(360, 664), 16, Color("#F7FBFF"))
	controls_label = _make_label(Vector2(710, 664), 14, Color("#B8C3D9"))
	result_label = _make_label(Vector2(350, 286), 28, Color("#F7FBFF"))
	result_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	result_label.size = Vector2(580, 170)
	result_label.visible = false
	_create_storyboard_hud()

func _make_label(position: Vector2, font_size: int, color: Color) -> Label:
	var label := Label.new()
	label.position = position
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.76))
	label.add_theme_constant_override("shadow_offset_x", 2)
	label.add_theme_constant_override("shadow_offset_y", 2)
	hud_layer.add_child(label)
	return label

func _create_storyboard_hud() -> void:
	storyboard_panel = PanelContainer.new()
	storyboard_panel.name = "ObjectiveStoryboard"
	storyboard_panel.position = Vector2(858, 92)
	storyboard_panel.size = Vector2(390, 184)
	storyboard_panel.add_theme_stylebox_override("panel", _make_panel_style(Color(0.02, 0.04, 0.08, 0.82), Color("#73FBD3")))
	hud_layer.add_child(storyboard_panel)

	var storyboard_stack := VBoxContainer.new()
	storyboard_stack.custom_minimum_size = Vector2(358, 158)
	storyboard_stack.add_theme_constant_override("separation", 5)
	storyboard_panel.add_child(storyboard_stack)

	storyboard_title_label = _make_story_label(14, Color("#F7FBFF"))
	storyboard_title_label.text = "CURRENT OBJECTIVE"
	storyboard_stack.add_child(storyboard_title_label)

	storyboard_route_label = _make_story_label(13, Color("#73FBD3"))
	storyboard_route_label.text = "Route locks after countdown."
	storyboard_route_label.custom_minimum_size = Vector2(348, 48)
	storyboard_stack.add_child(storyboard_route_label)

	storyboard_step_labels.clear()
	for index in range(MISSION_STORY.size()):
		var step_label := _make_story_label(12, Color("#B8C3D9"))
		step_label.custom_minimum_size = Vector2(348, 22)
		storyboard_stack.add_child(step_label)
		storyboard_step_labels.append(step_label)

	story_toast_panel = PanelContainer.new()
	story_toast_panel.name = "ObjectiveToast"
	story_toast_panel.position = Vector2(356, 22)
	story_toast_panel.size = Vector2(568, 86)
	story_toast_panel.custom_minimum_size = Vector2(568, 86)
	story_toast_panel.visible = false
	story_toast_panel.add_theme_stylebox_override("panel", _make_panel_style(Color(0.02, 0.04, 0.08, 0.86), Color("#FFD166")))
	hud_layer.add_child(story_toast_panel)

	story_toast_title_label = _make_label(Vector2(374, 36), 17, Color("#FFD166"))
	story_toast_title_label.size = Vector2(520, 24)
	story_toast_title_label.visible = false
	story_toast_body_label = _make_label(Vector2(374, 62), 13, Color("#F7FBFF"))
	story_toast_body_label.size = Vector2(520, 44)
	story_toast_body_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	story_toast_body_label.visible = false
	story_toast_title_label.text = ""
	story_toast_body_label.text = ""

	phase_scene_panel = PanelContainer.new()
	phase_scene_panel.name = "PhaseSceneCard"
	phase_scene_panel.position = Vector2(330, 500)
	phase_scene_panel.size = Vector2(620, 116)
	phase_scene_panel.custom_minimum_size = Vector2(620, 116)
	phase_scene_panel.visible = false
	phase_scene_panel.add_theme_stylebox_override("panel", _make_panel_style(Color(0.02, 0.04, 0.08, 0.88), Color("#73FBD3")))
	hud_layer.add_child(phase_scene_panel)

	phase_scene_title_label = _make_label(Vector2(354, 516), 19, Color("#73FBD3"))
	phase_scene_title_label.size = Vector2(572, 26)
	phase_scene_title_label.visible = false
	phase_scene_body_label = _make_label(Vector2(354, 548), 14, Color("#F7FBFF"))
	phase_scene_body_label.size = Vector2(572, 54)
	phase_scene_body_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	phase_scene_body_label.visible = false
	phase_scene_title_label.text = ""
	phase_scene_body_label.text = ""

	objective_banner_panel = PanelContainer.new()
	objective_banner_panel.name = "ObjectiveCompletionBanner"
	objective_banner_panel.position = Vector2(372, 184)
	objective_banner_panel.size = Vector2(536, 118)
	objective_banner_panel.custom_minimum_size = Vector2(536, 118)
	objective_banner_panel.visible = false
	objective_banner_panel.add_theme_stylebox_override("panel", _make_panel_style(Color(0.02, 0.04, 0.08, 0.88), Color("#73FBD3")))
	hud_layer.add_child(objective_banner_panel)

	objective_banner_title_label = _make_label(Vector2(392, 198), 23, Color("#73FBD3"))
	objective_banner_title_label.size = Vector2(496, 32)
	objective_banner_title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	objective_banner_title_label.visible = false
	objective_banner_body_label = _make_label(Vector2(392, 236), 15, Color("#F7FBFF"))
	objective_banner_body_label.size = Vector2(496, 52)
	objective_banner_body_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	objective_banner_body_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	objective_banner_body_label.visible = false
	objective_banner_title_label.text = ""
	objective_banner_body_label.text = ""

func _make_story_label(font_size: int, color: Color) -> Label:
	var label := Label.new()
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.clip_text = true
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.72))
	label.add_theme_constant_override("shadow_offset_x", 1)
	label.add_theme_constant_override("shadow_offset_y", 1)
	return label

func _make_panel_style(background: Color, border: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(8)
	style.content_margin_left = 14
	style.content_margin_right = 14
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	return style

func _update_hud() -> void:
	title_label.text = GAME_TITLE
	if phase == "attract":
		countdown_label.text = "Attract demo"
		mission_label.text = "Move or fire to start"
		status_label.text = "The station is running a playable route preview."
	elif phase == "join":
		countdown_label.text = "Join window: %02d" % int(ceil(join_remaining))
		mission_label.text = "P1 ready. P2 press Enter to join."
		status_label.text = "Generate sparks, frame the route, share the prototype."
	elif phase == "briefing":
		countdown_label.text = "Briefing: %02d" % int(ceil(scene_timer))
		mission_label.text = _story_title_for_index(0)
		status_label.text = mission_status
	elif phase == "play":
		if threat_grace_remaining > 0.0:
			countdown_label.text = "Safe launch: %02d" % int(ceil(threat_grace_remaining))
		else:
			countdown_label.text = "Mode: %s" % ("Duo" if active_player_count > 1 else "Solo")
		var mission_name: String = MISSION_NAMES[min(mission_index, MISSION_NAMES.size() - 1)]
		mission_label.text = "Mission %d/%d: %s" % [min(mission_index + 1, MISSION_NAMES.size()), MISSION_NAMES.size(), mission_name]
		status_label.text = mission_status
	elif phase == "intermission":
		countdown_label.text = "Scene shift"
		mission_label.text = _story_title_for_index(mission_index)
		status_label.text = mission_status
	else:
		countdown_label.text = "Run complete"
		mission_label.text = ""
		status_label.text = final_message
	score_label.text = "Team %s" % _format_score(team_score)
	timer_label.text = "Time %03d" % max(0, int(ceil(MAX_TIME_SECONDS - elapsed_seconds)))
	p1_label.text = _player_hud(players[0]) if players.size() > 0 else ""
	p2_label.text = _player_hud(players[1]) if players.size() > 1 else ""
	controls_label.text = "P1 WASD+E fire    P2 Arrows+Enter fire    R Restart"
	if finished:
		result_label.text = "%s\nTeam Score %s" % [final_message, _format_score(team_score)]
	_update_storyboard_hud()

func _update_storyboard_hud() -> void:
	if not storyboard_panel:
		return
	if phase == "attract":
		storyboard_route_label.text = "Demo loop\nMove or fire to start."
	elif phase == "join":
		storyboard_route_label.text = "Join window\nP2 can press Enter before launch."
	elif phase == "briefing":
		storyboard_route_label.text = "Briefing\n%s" % _objective_instruction_for_index(0)
	elif phase == "play":
		storyboard_route_label.text = "%s\n%s" % [_objective_progress_text(), _objective_instruction_for_index(mission_index)]
	elif phase == "intermission":
		storyboard_route_label.text = "Next phase\n%s" % _objective_instruction_for_index(mission_index)
	else:
		storyboard_route_label.text = "Run complete\nResult saved to Player Passport."

	for index in range(storyboard_step_labels.size()):
		var label := storyboard_step_labels[index]
		var story: Dictionary = MISSION_STORY[index]
		var prefix := "-"
		var color := Color("#B8C3D9")
		if phase == "finished" or index < mission_index:
			prefix = "DONE"
			color = Color("#73FBD3")
		elif (phase == "play" or phase == "intermission") and index == mission_index:
			prefix = "ACTIVE"
			color = Color("#FFD166")
		elif (phase == "join" or phase == "briefing" or phase == "attract") and index == 0:
			prefix = "NEXT"
			color = Color("#F7FBFF")
		label.add_theme_color_override("font_color", color)
		label.text = "%s  %d. %s" % [
			prefix,
			index + 1,
			story["title"]
		]

func _objective_instruction_for_index(index: int) -> String:
	match clamp(index, 0, MISSION_STORY.size() - 1):
		0:
			return "Collect every spark. Use walls to break seeker line of sight."
		1:
			return "Reach both principle gates. Either player can frame a gate."
		2:
			return "Hold the demo pad until the share meter fills."
	return ""

func _objective_progress_text() -> String:
	if phase != "play":
		return "Route: %s" % ("Duo" if active_player_count > 1 else "Solo")
	match mission_index:
		0:
			var remaining := 0
			for core in data_cores:
				if not bool(core.get("collected", false)):
					remaining += 1
			var total: int = max(data_cores.size(), 1)
			return "Sparks: %d/%d" % [total - remaining, total]
		1:
			var framed := 0
			for pad in relay_pads:
				if bool(pad.get("complete", false)):
					framed += 1
			var total_gates: int = max(relay_pads.size(), 1)
			return "Gates: %d/%d" % [framed, total_gates]
		2:
			return "Demo share: %d%%" % int(round(float(drone.get("charge", 0.0)) * 100.0))
	return "Objective complete"

func _show_phase_scene(title: String, body: String, color: Color, duration: float, pattern: String = "fade") -> void:
	if not phase_scene_panel:
		return
	phase_scene_title_label.text = title
	phase_scene_body_label.text = body
	phase_scene_title_label.add_theme_color_override("font_color", color)
	phase_scene_panel.add_theme_stylebox_override("panel", _make_panel_style(Color(0.02, 0.04, 0.08, 0.88), color))
	phase_scene_panel.visible = true
	phase_scene_title_label.visible = true
	phase_scene_body_label.visible = true
	phase_scene_panel.modulate = Color(1, 1, 1, 1)
	phase_scene_title_label.modulate = Color(1, 1, 1, 1)
	phase_scene_body_label.modulate = Color(1, 1, 1, 1)
	phase_scene_timer = max(0.0, duration)
	if not pattern.is_empty():
		_trigger_scene_transition(color.darkened(0.78), pattern)

func _update_phase_scene(delta: float) -> void:
	if not phase_scene_panel or not phase_scene_panel.visible:
		return
	if phase_scene_timer <= 0.0:
		return
	phase_scene_timer = max(0.0, phase_scene_timer - delta)
	var alpha: float = clamp(phase_scene_timer / 0.65, 0.0, 1.0) if phase_scene_timer < 0.65 else 1.0
	phase_scene_panel.modulate = Color(1, 1, 1, alpha)
	phase_scene_title_label.modulate = Color(1, 1, 1, alpha)
	phase_scene_body_label.modulate = Color(1, 1, 1, alpha)
	if phase_scene_timer <= 0.0:
		phase_scene_panel.visible = false
		phase_scene_title_label.visible = false
		phase_scene_body_label.visible = false

func _trigger_scene_transition(color: Color, pattern: String = "fade") -> void:
	var manager := get_node_or_null("/root/SceneManager")
	if not manager or not manager.has_method("fade_in_place"):
		return
	manager.fade_in_place({
		"speed": 3.4,
		"color": color,
		"pattern": pattern,
		"wait_time": 0.04,
		"ease": 1.25
	})

func _show_story_event(title: String, body: String) -> void:
	if not story_toast_panel:
		return
	if title.strip_edges().is_empty() and body.strip_edges().is_empty():
		story_toast_panel.visible = false
		story_toast_title_label.visible = false
		story_toast_body_label.visible = false
		return
	story_toast_title_label.text = title
	story_toast_body_label.text = body
	story_toast_panel.visible = true
	story_toast_title_label.visible = true
	story_toast_body_label.visible = true
	story_toast_panel.modulate = Color(1, 1, 1, 1)
	story_toast_title_label.modulate = Color(1, 1, 1, 1)
	story_toast_body_label.modulate = Color(1, 1, 1, 1)
	story_toast_timer = 3.8

func _update_story_toast(delta: float) -> void:
	if not story_toast_panel or story_toast_timer <= 0.0:
		return
	story_toast_timer = max(0.0, story_toast_timer - delta)
	var alpha: float = clamp(story_toast_timer / 0.55, 0.0, 1.0) if story_toast_timer < 0.55 else 1.0
	story_toast_panel.modulate = Color(1, 1, 1, alpha)
	story_toast_title_label.modulate = Color(1, 1, 1, alpha)
	story_toast_body_label.modulate = Color(1, 1, 1, alpha)
	if story_toast_timer <= 0.0:
		story_toast_panel.visible = false
		story_toast_title_label.visible = false
		story_toast_body_label.visible = false

func _show_objective_banner(title: String, body: String, color: Color) -> void:
	if not objective_banner_panel:
		return
	if title.strip_edges().is_empty() and body.strip_edges().is_empty():
		objective_banner_panel.visible = false
		objective_banner_title_label.visible = false
		objective_banner_body_label.visible = false
		return
	objective_banner_title_label.text = title
	objective_banner_body_label.text = body
	objective_banner_title_label.add_theme_color_override("font_color", color)
	objective_banner_panel.add_theme_stylebox_override("panel", _make_panel_style(Color(0.02, 0.04, 0.08, 0.9), color))
	objective_banner_panel.visible = true
	objective_banner_title_label.visible = true
	objective_banner_body_label.visible = true
	objective_banner_panel.modulate = Color(1, 1, 1, 1)
	objective_banner_title_label.modulate = Color(1, 1, 1, 1)
	objective_banner_body_label.modulate = Color(1, 1, 1, 1)
	objective_banner_timer = 2.9

func _update_objective_banner(delta: float) -> void:
	if not objective_banner_panel or objective_banner_timer <= 0.0:
		return
	objective_banner_timer = max(0.0, objective_banner_timer - delta)
	var alpha: float = clamp(objective_banner_timer / 0.6, 0.0, 1.0) if objective_banner_timer < 0.6 else 1.0
	objective_banner_panel.modulate = Color(1, 1, 1, alpha)
	objective_banner_title_label.modulate = Color(1, 1, 1, alpha)
	objective_banner_body_label.modulate = Color(1, 1, 1, alpha)
	if objective_banner_timer <= 0.0:
		objective_banner_panel.visible = false
		objective_banner_title_label.visible = false
		objective_banner_body_label.visible = false

func _flash_screen(color: Color, duration: float) -> void:
	if not screen_flash_rect:
		return
	screen_flash_rect.color = color
	screen_flash_rect.visible = true
	screen_flash_timer = max(screen_flash_timer, duration)

func _update_screen_flash(delta: float) -> void:
	if not screen_flash_rect or screen_flash_timer <= 0.0:
		return
	screen_flash_timer = max(0.0, screen_flash_timer - delta)
	var current := screen_flash_rect.color
	current.a = min(current.a, clamp(screen_flash_timer / 0.38, 0.0, 1.0) * current.a)
	screen_flash_rect.color = current
	if screen_flash_timer <= 0.0:
		screen_flash_rect.visible = false

func _spawn_burst(position: Vector3, color: Color, intensity: float = 1.0) -> void:
	if not fx_root:
		return
	var burst := Node3D.new()
	burst.name = "StoryBurst"
	burst.position = position
	fx_root.add_child(burst)
	var fx_material := _make_material(color, color, 1.25, 0.68)
	var ring_mesh := TorusMesh.new()
	ring_mesh.inner_radius = 0.18
	ring_mesh.outer_radius = 0.24
	ring_mesh.ring_segments = 64
	var ring := MeshInstance3D.new()
	ring.name = "BurstRing"
	ring.mesh = ring_mesh
	ring.material_override = fx_material
	ring.rotation.x = PI / 2.0
	burst.add_child(ring)
	for index in range(8):
		var angle := float(index) / 8.0 * TAU
		var spark := _make_sphere(0.035 * intensity, fx_material, Vector3(cos(angle) * 0.22, 0.08, sin(angle) * 0.22), burst)
		spark.name = "BurstSpark"
	var light := OmniLight3D.new()
	light.name = "BurstLight"
	light.light_color = color
	light.light_energy = 0.9 * intensity
	light.omni_range = 2.5 * intensity
	burst.add_child(light)
	fx_events.append({
		"node": burst,
		"age": 0.0,
		"duration": 0.85,
		"maxScale": 2.3 * intensity
	})

func _spawn_phase_complete_wave(position: Vector3, color: Color) -> void:
	if not fx_root:
		return
	var wave := Node3D.new()
	wave.name = "PhaseCompleteWave"
	wave.position = Vector3(position.x, 0.08, position.z)
	fx_root.add_child(wave)
	var wave_material := _make_material(color, color, 0.9, 0.36)
	for index in range(2):
		var ring_mesh := TorusMesh.new()
		ring_mesh.inner_radius = 0.42 + float(index) * 0.18
		ring_mesh.outer_radius = 0.48 + float(index) * 0.18
		ring_mesh.ring_segments = 96
		var ring := MeshInstance3D.new()
		ring.name = "PhaseWaveRing%d" % index
		ring.mesh = ring_mesh
		ring.material_override = wave_material
		ring.rotation.x = PI / 2.0
		wave.add_child(ring)
	var sweep := _make_box(Vector3(0.18, 0.08, 2.4), wave_material, Vector3(0, 0.08, 0), wave)
	sweep.name = "PhaseWaveSweep"
	var light := OmniLight3D.new()
	light.name = "BurstLight"
	light.light_color = color
	light.light_energy = 1.15
	light.omni_range = 4.8
	light.position = Vector3(0.0, 0.7, 0.0)
	wave.add_child(light)
	fx_events.append({
		"node": wave,
		"age": 0.0,
		"duration": 1.35,
		"maxScale": 4.8
	})

func _update_fx_events(delta: float) -> void:
	for index in range(fx_events.size() - 1, -1, -1):
		var event := fx_events[index]
		var node: Node3D = event.get("node")
		if not node or not is_instance_valid(node):
			fx_events.remove_at(index)
			continue
		var age: float = float(event.get("age", 0.0)) + delta
		var duration: float = float(event.get("duration", 0.85))
		if age >= duration:
			node.queue_free()
			fx_events.remove_at(index)
			continue
		var t := age / duration
		node.scale = Vector3.ONE * lerp(0.5, float(event.get("maxScale", 2.0)), t)
		var light := node.get_node_or_null("BurstLight") as OmniLight3D
		if light:
			light.light_energy = lerp(light.light_energy, 0.0, min(1.0, delta * 7.0))
		event["age"] = age
		fx_events[index] = event

func _story_title_for_index(index: int) -> String:
	var story: Dictionary = MISSION_STORY[clamp(index, 0, MISSION_STORY.size() - 1)]
	return "Objective %d: %s" % [index + 1, story["title"]]

func _story_brief_for_index(index: int) -> String:
	var story: Dictionary = MISSION_STORY[clamp(index, 0, MISSION_STORY.size() - 1)]
	var route_text: String = story["coop"] if active_player_count > 1 else story["solo"]
	return "%s %s" % [route_text, story["hint"]]

func _player_hud(player: Dictionary) -> String:
	if not bool(player["joined"]):
		return "%s waiting" % player["slot"]
	var weapon_text := "ready" if float(player.get("weaponCooldown", 0.0)) <= 0.0 else "charging"
	return "%s %s  Energy %d  Pulse %s" % [player["slot"], player["displayName"], int(player["energy"]), weapon_text]

func _demo_launch_payload() -> Dictionary:
	return {
		"cabinetId": "DEMO-CABINET",
		"siteId": "LOCAL-DEMO",
		"gameId": GAME_ID,
		"gameSessionId": "demo-%d" % Time.get_unix_time_from_system(),
		"mode": "solo",
		"issuedAt": _utc_now_iso(),
		"players": [
			_demo_player("P1", "Nova", "#1FD6B5", "#FF5A6A", "#FFD166", true)
		]
	}

func _demo_player(slot: String, display_name: String, primary: String, secondary: String, accent: String, is_guest: bool) -> Dictionary:
	return {
		"slot": slot,
		"playerId": "guest",
		"displayName": display_name,
		"level": 1,
		"isGuest": is_guest,
		"avatar": {
			"manifestVersion": "nexus-avatar-manifest/v1",
			"avatarId": "%s_demo" % display_name.to_lower(),
			"bodyId": "body_neon_hero" if slot == "P1" else "body_runner_core",
			"bodyType": "hero" if slot == "P1" else "runner",
			"hairId": "hair_glowhawk" if slot == "P1" else "hair_short_crop",
			"helmetId": "helmet_none",
			"visorId": "visor_shutter" if slot == "P1" else "visor_clear",
			"outfitId": "outfit_sunset_armor" if slot == "P1" else "outfit_laser_varsity",
			"bootsId": "boots_hover_soles" if slot == "P1" else "boots_grid_runners",
			"backId": "back_boost_pack" if slot == "P1" else "back_none",
			"trailId": "trail_comet" if slot == "P1" else "trail_neon",
			"auraId": "aura_sunset_ring" if slot == "P1" else "aura_none",
			"primaryColor": primary,
			"secondaryColor": secondary,
			"accentColor": accent
		},
		"avatarRuntime": {
			"manifestVersion": "nexus-avatar-manifest/v1",
			"target": "3d",
			"avatarId": "%s_demo" % display_name.to_lower(),
			"colors": { "primary": primary, "secondary": secondary, "accent": accent },
			"morphology": { "bodyType": "hero" if slot == "P1" else "runner", "bodyId": "body_neon_hero" if slot == "P1" else "body_runner_core", "headId": "head_neon_human" },
			"equipment": {
				"body": "body_neon_hero" if slot == "P1" else "body_runner_core",
				"head": "head_neon_human",
				"hair": "hair_glowhawk" if slot == "P1" else "hair_short_crop",
				"helmet": "helmet_none",
				"visor": "visor_shutter" if slot == "P1" else "visor_clear",
				"outfit": "outfit_sunset_armor" if slot == "P1" else "outfit_laser_varsity",
				"boots": "boots_hover_soles" if slot == "P1" else "boots_grid_runners",
				"back": "back_boost_pack" if slot == "P1" else "back_none",
				"trail": "trail_comet" if slot == "P1" else "trail_neon",
				"aura": "aura_sunset_ring" if slot == "P1" else "aura_none"
			},
			"animation": { "poseId": "power", "emoteId": "emote_wave", "animationSet": "hero_idle" },
			"addons": [],
			"compatibility": { "supportedSlots": [], "supportedTargets": ["2d", "3d"] }
		}
	}

func _joined_players() -> Array:
	var joined := []
	for player in players:
		if bool(player["joined"]):
			joined.append(player)
	return joined

func _living_players() -> int:
	var count := 0
	for player in _joined_players():
		if player["energy"] > 0.0:
			count += 1
	return count

func _point_in_hazard(position: Vector3) -> bool:
	for hazard in hazards:
		if _flat_distance(position, hazard["position"]) <= hazard["radius"]:
			return true
	return false

func _flat_distance(a: Vector3, b: Vector3) -> float:
	return Vector2(a.x, a.z).distance_to(Vector2(b.x, b.z))

func _camera_relative_input(slot: String) -> Vector3:
	var input := Vector2(
		Input.get_action_strength("%s_right" % slot) - Input.get_action_strength("%s_left" % slot),
		Input.get_action_strength("%s_up" % slot) - Input.get_action_strength("%s_down" % slot)
	)
	if input.length() > 1.0:
		input = input.normalized()
	if input.length() <= 0.01 or not camera:
		return Vector3.ZERO
	var forward := -camera.global_transform.basis.z
	forward.y = 0.0
	forward = forward.normalized()
	var right := camera.global_transform.basis.x
	right.y = 0.0
	right = right.normalized()
	return (right * input.x + forward * input.y).normalized()

func _animate_player_movement(player: Dictionary, speed_ratio: float, delta: float) -> void:
	var node: Node3D = player["node"]
	var phase_value: float = float(player["stridePhase"])
	var suit := node.get_node_or_null("ImportedOperatorSuit") as Node3D
	if suit:
		suit.rotation.x = lerp_angle(suit.rotation.x, sin(phase_value) * 0.06 * speed_ratio, min(1.0, delta * 9.0))
		suit.rotation.z = lerp_angle(suit.rotation.z, sin(phase_value * 0.5) * 0.035 * speed_ratio, min(1.0, delta * 9.0))
		var animation_player := suit.get_node_or_null("OperatorAnimationPlayer") as AnimationPlayer
		if animation_player:
			var target_animation := "run" if speed_ratio > 0.08 else "idle"
			if animation_player.current_animation != target_animation:
				animation_player.play(target_animation, 0.15)
			animation_player.speed_scale = lerp(0.82, 1.32, speed_ratio)
		else:
			var skeleton := _find_skeleton_node(suit)
			if skeleton:
				var stride := sin(phase_value) * 0.46 * speed_ratio
				var counter_stride := sin(phase_value + PI) * 0.46 * speed_ratio
				_set_bone_pose_rotation(skeleton, "LeftArm", Vector3(1, 0, 0), counter_stride * 0.72)
				_set_bone_pose_rotation(skeleton, "RightArm", Vector3(1, 0, 0), stride * 0.72)
				_set_bone_pose_rotation(skeleton, "LeftUpLeg", Vector3(1, 0, 0), stride)
				_set_bone_pose_rotation(skeleton, "RightUpLeg", Vector3(1, 0, 0), counter_stride)
				_set_bone_pose_rotation(skeleton, "LeftLeg", Vector3(1, 0, 0), max(0.0, -stride) * 0.62)
				_set_bone_pose_rotation(skeleton, "RightLeg", Vector3(1, 0, 0), max(0.0, -counter_stride) * 0.62)
	var move_light := node.get_node_or_null("OperatorMoveLight") as OmniLight3D
	if move_light:
		move_light.light_energy = 0.38 + speed_ratio * 0.44
		move_light.omni_range = 2.5 + speed_ratio * 0.9

func _find_skeleton_node(node: Node) -> Skeleton3D:
	if node is Skeleton3D:
		return node
	for child in node.get_children():
		var skeleton := _find_skeleton_node(child)
		if skeleton:
			return skeleton
	return null

func _find_named_node(node: Node, node_name: String) -> Node:
	if not node:
		return null
	if node.name == node_name:
		return node
	for child in node.get_children():
		var found := _find_named_node(child, node_name)
		if found:
			return found
	return null

func _set_bone_pose_rotation(skeleton: Skeleton3D, bone_name: String, axis: Vector3, angle: float) -> void:
	var bone := skeleton.find_bone(bone_name)
	if bone < 0:
		return
	skeleton.set_bone_pose_rotation(bone, Quaternion(axis.normalized(), angle))

func _nearest_living_player(position: Vector3, max_distance: float) -> Dictionary:
	var nearest := {}
	var nearest_distance := max_distance
	for player in _joined_players():
		if player["energy"] <= 0.0:
			continue
		var distance := _flat_distance(position, player["position"])
		if distance < nearest_distance:
			nearest_distance = distance
			nearest = player
	return nearest

func _steer_around_blockers(position: Vector3, direction: Vector2, radius: float) -> Vector2:
	if direction.length() <= 0.01:
		return Vector2.ZERO
	var ahead := position + Vector3(direction.x, 0.0, direction.y) * (radius + 0.72)
	if not _collides_with_static(ahead, radius) and not _collides_with_physics_prop(ahead, radius):
		return direction
	for angle in [PI / 4.0, -PI / 4.0, PI / 2.0, -PI / 2.0, PI]:
		var candidate := direction.rotated(angle).normalized()
		var candidate_point := position + Vector3(candidate.x, 0.0, candidate.y) * (radius + 0.86)
		if not _collides_with_static(candidate_point, radius) and not _collides_with_physics_prop(candidate_point, radius):
			return candidate
	return Vector2.ZERO

func _resolve_sentry_motion(previous_position: Vector3, velocity: Vector2, radius: float, delta: float) -> Dictionary:
	var resolved := previous_position
	var adjusted_velocity := velocity

	var x_candidate := Vector3(previous_position.x + adjusted_velocity.x * delta, previous_position.y, previous_position.z)
	x_candidate.x = clamp(x_candidate.x, ARENA_RECT.position.x + radius, ARENA_RECT.end.x - radius)
	if _collides_with_static(x_candidate, radius):
		adjusted_velocity.x = 0.0
	else:
		if _collides_with_physics_prop(x_candidate, radius):
			_push_physics_props(x_candidate, Vector3(adjusted_velocity.x, 0.0, 0.0), radius, 1.6)
		if _collides_with_physics_prop(x_candidate, radius):
			adjusted_velocity.x = 0.0
		else:
			resolved.x = x_candidate.x

	var z_candidate := Vector3(resolved.x, previous_position.y, previous_position.z + adjusted_velocity.y * delta)
	z_candidate.z = clamp(z_candidate.z, ARENA_RECT.position.y + radius, ARENA_RECT.end.y - radius)
	if _collides_with_static(z_candidate, radius):
		adjusted_velocity.y = 0.0
	else:
		if _collides_with_physics_prop(z_candidate, radius):
			_push_physics_props(z_candidate, Vector3(0.0, 0.0, adjusted_velocity.y), radius, 1.6)
		if _collides_with_physics_prop(z_candidate, radius):
			adjusted_velocity.y = 0.0
		else:
			resolved.z = z_candidate.z

	resolved = _resolve_static_overlap(resolved, radius)
	return { "position": resolved, "velocity": adjusted_velocity }

func _resolve_player_motion(previous_position: Vector3, desired_position: Vector3, velocity: Vector3) -> Dictionary:
	var resolved := previous_position
	var adjusted_velocity := velocity

	var x_candidate := Vector3(desired_position.x, previous_position.y, previous_position.z)
	var clamped_x: float = clamp(x_candidate.x, ARENA_RECT.position.x + PLAYER_RADIUS, ARENA_RECT.end.x - PLAYER_RADIUS)
	if not is_equal_approx(clamped_x, x_candidate.x):
		adjusted_velocity.x = 0.0
	x_candidate.x = clamped_x
	if _collides_with_static(x_candidate, PLAYER_RADIUS) or _collides_with_sentry(x_candidate, PLAYER_RADIUS):
		adjusted_velocity.x = 0.0
	else:
		if _collides_with_physics_prop(x_candidate, PLAYER_RADIUS):
			_push_physics_props(x_candidate, Vector3(adjusted_velocity.x, 0.0, 0.0), PLAYER_RADIUS, 3.4)
		if _collides_with_physics_prop(x_candidate, PLAYER_RADIUS):
			adjusted_velocity.x = 0.0
		else:
			resolved.x = x_candidate.x

	var z_candidate := Vector3(resolved.x, previous_position.y, desired_position.z)
	var clamped_z: float = clamp(z_candidate.z, ARENA_RECT.position.y + PLAYER_RADIUS, ARENA_RECT.end.y - PLAYER_RADIUS)
	if not is_equal_approx(clamped_z, z_candidate.z):
		adjusted_velocity.z = 0.0
	z_candidate.z = clamped_z
	if _collides_with_static(z_candidate, PLAYER_RADIUS) or _collides_with_sentry(z_candidate, PLAYER_RADIUS):
		adjusted_velocity.z = 0.0
	else:
		if _collides_with_physics_prop(z_candidate, PLAYER_RADIUS):
			_push_physics_props(z_candidate, Vector3(0.0, 0.0, adjusted_velocity.z), PLAYER_RADIUS, 3.4)
		if _collides_with_physics_prop(z_candidate, PLAYER_RADIUS):
			adjusted_velocity.z = 0.0
		else:
			resolved.z = z_candidate.z

	resolved = _resolve_static_overlap(resolved, PLAYER_RADIUS)
	return { "position": resolved, "velocity": adjusted_velocity }

func _collides_with_static(position: Vector3, radius: float) -> bool:
	var point := Vector2(position.x, position.z)
	for obstacle in collision_obstacles:
		var rect: Rect2 = obstacle["rect"]
		if rect.grow(radius).has_point(point):
			return true
	return false

func _resolve_static_overlap(position: Vector3, radius: float) -> Vector3:
	var resolved := position
	for _pass in range(4):
		var moved := false
		var point := Vector2(resolved.x, resolved.z)
		for obstacle in collision_obstacles:
			var rect: Rect2 = obstacle["rect"]
			var grown: Rect2 = rect.grow(radius + 0.025)
			if not grown.has_point(point):
				continue
			var left: float = abs(point.x - grown.position.x)
			var right: float = abs(grown.end.x - point.x)
			var top: float = abs(point.y - grown.position.y)
			var bottom: float = abs(grown.end.y - point.y)
			var nearest: float = min(min(left, right), min(top, bottom))
			if nearest == left:
				point.x = grown.position.x - 0.035
			elif nearest == right:
				point.x = grown.end.x + 0.035
			elif nearest == top:
				point.y = grown.position.y - 0.035
			else:
				point.y = grown.end.y + 0.035
			moved = true
		resolved.x = clamp(point.x, ARENA_RECT.position.x + radius, ARENA_RECT.end.x - radius)
		resolved.z = clamp(point.y, ARENA_RECT.position.y + radius, ARENA_RECT.end.y - radius)
		if not moved:
			break
	return resolved

func _resolve_dynamic_overlap_with_sentries(current_sentry: Dictionary, position: Vector3, radius: float) -> Vector3:
	var resolved := position
	var current_node = current_sentry.get("node")
	for other in sentries:
		if not bool(other.get("alive", true)) or other.get("node") == current_node:
			continue
		var other_position: Vector3 = other["position"]
		var offset := Vector2(resolved.x - other_position.x, resolved.z - other_position.z)
		var min_distance: float = radius + float(other["radius"])
		if offset.length() >= min_distance:
			continue
		var direction := offset.normalized() if offset.length() > 0.01 else Vector2.RIGHT.rotated(rng.randf_range(0.0, TAU))
		var overlap: float = min_distance - max(offset.length(), 0.01)
		resolved += Vector3(direction.x, 0.0, direction.y) * overlap * 0.55
	resolved.x = clamp(resolved.x, ARENA_RECT.position.x + radius, ARENA_RECT.end.x - radius)
	resolved.z = clamp(resolved.z, ARENA_RECT.position.y + radius, ARENA_RECT.end.y - radius)
	return _resolve_static_overlap(resolved, radius)

func _collides_with_sentry(position: Vector3, radius: float) -> bool:
	for sentry in sentries:
		if not bool(sentry.get("alive", true)):
			continue
		if _flat_distance(position, sentry["position"]) <= radius + float(sentry["radius"]) * 0.82:
			return true
	return false

func _collides_with_physics_prop(position: Vector3, radius: float) -> bool:
	for prop in physics_props:
		if _flat_distance(position, prop["position"]) <= radius + float(prop["radius"]) * 0.9:
			return true
	return false

func _push_physics_props(position: Vector3, velocity: Vector3, radius: float, strength: float) -> bool:
	var pushed := false
	var push_vector := Vector2(velocity.x, velocity.z)
	for prop in physics_props:
		var prop_position: Vector3 = prop["position"]
		var offset := Vector2(prop_position.x - position.x, prop_position.z - position.z)
		var min_distance: float = radius + float(prop["radius"])
		if offset.length() > min_distance:
			continue
		var direction := Vector2.ZERO
		if offset.length() > 0.01:
			direction = offset.normalized()
		elif push_vector.length() > 0.05:
			direction = push_vector.normalized()
		else:
			direction = Vector2.RIGHT.rotated(rng.randf_range(0.0, TAU))
		if push_vector.length() > 0.05:
			direction = (direction + push_vector.normalized() * 0.28).normalized()
		var overlap: float = max(0.0, min_distance - max(offset.length(), 0.01))
		var next_position := prop_position + Vector3(direction.x, 0.0, direction.y) * overlap * 0.72
		next_position.x = clamp(next_position.x, ARENA_RECT.position.x + float(prop["radius"]), ARENA_RECT.end.x - float(prop["radius"]))
		next_position.z = clamp(next_position.z, ARENA_RECT.position.y + float(prop["radius"]), ARENA_RECT.end.y - float(prop["radius"]))
		var prop_velocity: Vector2 = prop["velocity"]
		if _collides_with_static(next_position, float(prop["radius"])):
			prop_velocity = prop_velocity.move_toward(Vector2.ZERO, strength)
		else:
			prop["position"] = next_position
			prop_velocity += direction * strength * (0.65 + overlap) / float(prop["mass"])
			pushed = true
		prop["velocity"] = prop_velocity.limit_length(5.2)
	return pushed

func _register_box_obstacle(center: Vector3, size: Vector3, name: String) -> void:
	if size.x <= 0.0 or size.z <= 0.0:
		return
	var rect := Rect2(Vector2(center.x - size.x * 0.5, center.z - size.z * 0.5), Vector2(size.x, size.z))
	collision_obstacles.append({ "name": name, "rect": rect, "center": center, "size": size })
	_add_static_collision_box(center, size, name)

func _register_model_obstacle(model: Node3D, fallback_center: Vector3, fallback_size: Vector3, name: String, padding: float) -> void:
	var bounds := _flat_bounds_for_node(model)
	if bounds.size.x <= 0.05 or bounds.size.y <= 0.05:
		_register_box_obstacle(fallback_center, fallback_size, name)
		return
	var clamped_position := Vector2(
		clamp(bounds.position.x - padding, ARENA_RECT.position.x - 0.9, ARENA_RECT.end.x + 0.9),
		clamp(bounds.position.y - padding, ARENA_RECT.position.y - 0.9, ARENA_RECT.end.y + 0.9)
	)
	var clamped_end := Vector2(
		clamp(bounds.end.x + padding, ARENA_RECT.position.x - 0.9, ARENA_RECT.end.x + 0.9),
		clamp(bounds.end.y + padding, ARENA_RECT.position.y - 0.9, ARENA_RECT.end.y + 0.9)
	)
	var size := Vector3(max(0.45, clamped_end.x - clamped_position.x), max(0.55, fallback_size.y), max(0.45, clamped_end.y - clamped_position.y))
	var center := Vector3(clamped_position.x + size.x * 0.5, fallback_center.y, clamped_position.y + size.z * 0.5)
	_register_box_obstacle(center, size, name)

func _flat_bounds_for_node(model: Node3D) -> Rect2:
	if not model:
		return Rect2()
	var state := {
		"has": false,
		"min_x": 1.0e20,
		"max_x": -1.0e20,
		"min_z": 1.0e20,
		"max_z": -1.0e20
	}
	_collect_flat_bounds(model, state)
	if not bool(state["has"]):
		return Rect2()
	return Rect2(
		Vector2(float(state["min_x"]), float(state["min_z"])),
		Vector2(float(state["max_x"]) - float(state["min_x"]), float(state["max_z"]) - float(state["min_z"]))
	)

func _collect_flat_bounds(node: Node, state: Dictionary) -> void:
	if node is MeshInstance3D:
		var mesh_node := node as MeshInstance3D
		var aabb := mesh_node.get_aabb()
		for x in [aabb.position.x, aabb.end.x]:
			for y in [aabb.position.y, aabb.end.y]:
				for z in [aabb.position.z, aabb.end.z]:
					var world_point: Vector3 = mesh_node.global_transform * Vector3(x, y, z)
					state["has"] = true
					state["min_x"] = min(float(state["min_x"]), world_point.x)
					state["max_x"] = max(float(state["max_x"]), world_point.x)
					state["min_z"] = min(float(state["min_z"]), world_point.z)
					state["max_z"] = max(float(state["max_z"]), world_point.z)
	for child in node.get_children():
		_collect_flat_bounds(child, state)

func _add_static_collision_box(center: Vector3, size: Vector3, name: String) -> void:
	if not collision_root:
		return
	var body := StaticBody3D.new()
	body.name = "%sCollider" % name
	body.position = center
	var shape := BoxShape3D.new()
	shape.size = size
	var collider := CollisionShape3D.new()
	collider.shape = shape
	body.add_child(collider)
	collision_root.add_child(body)

func _rotated_footprint_size(size: Vector3, rotation_y: float) -> Vector3:
	var c: float = abs(cos(rotation_y))
	var s: float = abs(sin(rotation_y))
	return Vector3(size.x * c + size.z * s, size.y, size.x * s + size.z * c)

func _random_open_point_in_rect(rect: Rect2, clearance: float) -> Vector3:
	for _attempt in range(64):
		var candidate := _random_point_in_rect(rect)
		if not _collides_with_static(candidate, clearance):
			return candidate
	var step: float = max(0.55, clearance * 0.85)
	var columns: int = max(1, int(floor(rect.size.x / step)))
	var rows: int = max(1, int(floor(rect.size.y / step)))
	var start_column := rng.randi_range(0, max(0, columns - 1))
	var start_row := rng.randi_range(0, max(0, rows - 1))
	for column_offset in range(columns):
		for row_offset in range(rows):
			var column := (start_column + column_offset) % columns
			var row := (start_row + row_offset) % rows
			var candidate: Vector3 = Vector3(rect.position.x + (float(column) + 0.5) * step, 0.0, rect.position.y + (float(row) + 0.5) * step)
			if rect.has_point(Vector2(candidate.x, candidate.z)) and not _collides_with_static(candidate, clearance):
				return candidate
	var center := Vector3(rect.position.x + rect.size.x * 0.5, 0.0, rect.position.y + rect.size.y * 0.5)
	return _resolve_static_overlap(center, clearance)

func _random_open_point_away_from_players(rect: Rect2, clearance: float, minimum_player_distance: float) -> Vector3:
	for _attempt in range(96):
		var candidate := _random_point_in_rect(rect)
		if _collides_with_static(candidate, clearance) or not _spawn_clear_of_dynamic_objects(candidate, clearance):
			continue
		var far_enough := true
		for player in players:
			if _flat_distance(candidate, player["position"]) < minimum_player_distance:
				far_enough = false
				break
		if far_enough:
				return candidate
	return _random_open_point_in_rect(rect, clearance)

func _spawn_clear_of_dynamic_objects(candidate: Vector3, clearance: float) -> bool:
	if _collides_with_sentry(candidate, clearance) or _collides_with_physics_prop(candidate, clearance):
		return false
	for core in data_cores:
		if not bool(core.get("collected", false)) and _flat_distance(candidate, core["position"]) < clearance + 0.7:
			return false
	for cache in supply_caches:
		if not bool(cache.get("collected", false)) and _flat_distance(candidate, cache["position"]) < clearance + float(cache.get("radius", 0.9)):
			return false
	for hazard in hazards:
		if _flat_distance(candidate, hazard["position"]) < clearance + float(hazard.get("radius", 1.0)):
			return false
	return true

func _safe_spawn_position(preferred: Vector3, clearance: float) -> Vector3:
	var safe := _resolve_static_overlap(preferred, clearance)
	if not _collides_with_static(safe, clearance):
		return safe
	var search_radii: Array[float] = [0.75, 1.25, 1.85, 2.45, 3.1]
	for radius in search_radii:
		for step in range(12):
			var angle := float(step) / 12.0 * TAU + rng.randf_range(-0.08, 0.08)
			var candidate: Vector3 = preferred + Vector3(cos(angle), 0.0, sin(angle)) * radius
			candidate.x = clamp(candidate.x, ARENA_RECT.position.x + clearance, ARENA_RECT.end.x - clearance)
			candidate.z = clamp(candidate.z, ARENA_RECT.position.y + clearance, ARENA_RECT.end.y - clearance)
			candidate = _resolve_static_overlap(candidate, clearance)
			if not _collides_with_static(candidate, clearance):
				return candidate
	return safe

func _random_point_in_rect(rect: Rect2) -> Vector3:
	return Vector3(
		rng.randf_range(rect.position.x, rect.end.x),
		0.0,
		rng.randf_range(rect.position.y, rect.end.y)
	)

func _make_box(size: Vector3, material: Material, position: Vector3, parent: Node = null) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = size
	var instance := MeshInstance3D.new()
	instance.mesh = mesh
	instance.material_override = material
	instance.position = position
	instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	(parent if parent else world_root).add_child(instance)
	return instance

func _make_sphere(radius: float, material: Material, position: Vector3, parent: Node = null) -> MeshInstance3D:
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	var instance := MeshInstance3D.new()
	instance.mesh = mesh
	instance.material_override = material
	instance.position = position
	instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	(parent if parent else world_root).add_child(instance)
	return instance

func _make_cylinder(radius: float, height: float, material: Material, position: Vector3, parent: Node = null) -> MeshInstance3D:
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	mesh.radial_segments = 48
	var instance := MeshInstance3D.new()
	instance.mesh = mesh
	instance.material_override = material
	instance.position = position
	instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	(parent if parent else world_root).add_child(instance)
	return instance

func _clear_children(node: Node) -> void:
	for child in node.get_children():
		child.queue_free()

func _color_from_string(value: String, fallback: Color) -> Color:
	if value.begins_with("#") and value.length() == 7:
		return Color(value)
	return fallback

func _format_score(score: int) -> String:
	var text := str(max(score, 0))
	var output := ""
	while text.length() > 3:
		output = "," + text.substr(text.length() - 3, 3) + output
		text = text.substr(0, text.length() - 3)
	return text + output

func _utc_now_iso() -> String:
	return "%sZ" % Time.get_datetime_string_from_system(true, false)
