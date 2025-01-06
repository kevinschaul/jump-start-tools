local pickers = require("telescope.pickers")
local finders = require("telescope.finders")
local actions = require("telescope.actions")
local action_state = require("telescope.actions.state")
local conf = require("telescope.config").values

-- Debug setup
local log_file = io.open("./nvim-debug.log", "a")
local function debug_print(...)
	if log_file then
		log_file:write(string.format("[%s] ", os.date("%Y-%m-%d %H:%M:%S")))
		log_file:write(table.concat({ ... }, " ") .. "\n")
		log_file:flush()
	end
end

-- Generate the `jump-start use` command for this starter
local function generate_use_command(entry_parts)
	return "!jump-start use " .. entry_parts.instance .. "/" .. entry_parts.group .. "/" .. entry_parts.name
end

-- Generate the string to display in Telescope for this starter
local function generate_display(entry_parts)
	return entry_parts.instance .. "/" .. entry_parts.group .. "/" .. entry_parts.name
end

local function make_entry_from_jump_start(entry)
	debug_print("Processing entry:", vim.inspect(entry))
	-- `jump-start find` prints each result in a tab-delimited format
	local parts_raw = vim.split(entry, "\t")
	local parts = {
		starter_path = parts_raw[1],
		yaml_path = parts_raw[1] .. "/jump-start.yaml",
		instance = parts_raw[2],
		group = parts_raw[3],
		name = parts_raw[4],
		main_file = parts_raw[5],
	}

	local use_command = generate_use_command(parts)
	local display = generate_display(parts)

	-- Default to the yaml file unless a main_file is defined
	local filename = parts.yaml_path
	if parts.main_file ~= nil and parts.main_file ~= "" then
		filename = parts.starter_path .. "/" .. parts.main_file
	end

	return {
		value = use_command,
		ordinal = entry,
		display = display,
		filename = filename,
		lnum = 1,
	}
end

local function paste_result_into_buffer(prompt_bufnr)
	local entry = action_state.get_selected_entry()
	-- Close Telescope
	actions.close(prompt_bufnr)

	if entry and entry.filename then
		local content = vim.fn.readfile(entry.filename)
		vim.api.nvim_put(content, "l", false, true)
	end
end

local function open_in_new_buffer(prompt_bufnr)
	local entry = action_state.get_selected_entry()
	-- Close Telescope
	actions.close(prompt_bufnr)

	if entry and entry.filename then
		vim.cmd("e " .. vim.fn.fnameescape(entry.filename))
	end
end

local function find(opts)
	opts = opts or {}

	pickers
			.new(opts, {
				prompt_title = "jump-start find",
				finder = finders.new_job(function(prompt)
					-- Only send the search if there's a prompt
					if prompt ~= "" then
						return { "jump-start", "find", prompt }
					end
					-- Return empty results for empty prompt
					return { "echo", "" }
				end, make_entry_from_jump_start),
				previewer = conf.file_previewer(opts),
				attach_mappings = function(prompt_bufnr, map)
					-- Put the `jump-start use` command in the command line
					actions.select_default:replace(actions.edit_command_line)
					map({ "i", "n" }, "<C-p>", paste_result_into_buffer)
					map({ "i", "n" }, "<C-t>", open_in_new_buffer)
					return true
				end,
			})
			:find()
end

local function setup(ext_config, config)
	-- ext_config and config are optional
end

return require("telescope").register_extension({
	setup = setup,
	exports = {
		find = find,
	},
})
