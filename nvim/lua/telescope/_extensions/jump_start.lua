local pickers = require("telescope.pickers")
local finders = require("telescope.finders")
local actions = require("telescope.actions")
local action_state = require("telescope.actions.state")
local conf = require("telescope.config").values
local utils = require("telescope.utils")
local log = require("telescope.log")

-- Debug setup
-- local log_file = io.open("./nvim-debug.log", "a")
local function debug_print(...)
	if log_file then
		log_file:write(string.format("[%s] ", os.date("%Y-%m-%d %H:%M:%S")))
		-- log_file:write(table.concat({ ... }, " ") .. "\n")
		log_file:write(vim.inspect(...) .. "\n")
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

local function make_entry_from_jump_start(output)
	-- `jump-start find` prints each result in a tab-delimited format
	local parts_raw = vim.split(output, "\t")
	local parts = {
		starter_path = parts_raw[1],
		yaml_path = parts_raw[1] .. "/jump-start.yaml",
		instance = parts_raw[2],
		group = parts_raw[3],
		name = parts_raw[4],
		main_file = parts_raw[5],
	}

	local display = generate_display(parts)

	return {
		value = parts,
		display = display,
		ordinal = display,
		path = parts.starter_path,
	}
end

local function make_entry_from_fd(starter_entry, output)
	local use_command = generate_use_command(starter_entry.value)

	return {
		value = use_command,
		display = output,
		ordinal = output,
		path = starter_entry.value.starter_path .. "/" .. output,
	}
end

local function paste_result_into_buffer(prompt_bufnr)
	local entry = action_state.get_selected_entry()
	-- Close Telescope
	actions.close(prompt_bufnr)

	if entry and entry.path then
		local content = vim.fn.readfile(entry.path)
		vim.api.nvim_put(content, "l", false, true)
	end
end

local function open_in_new_buffer(prompt_bufnr)
	local entry = action_state.get_selected_entry()
	-- Close Telescope
	actions.close(prompt_bufnr)

	if entry and entry.path then
		vim.cmd("e " .. vim.fn.fnameescape(entry.path))
	end
end

-- A Telescope picker for looking at a starter’s files
-- This picker is opened by the find picker.
--
-- @argument opts - Telescope opts
-- @argument starter_entry - Telescope entry for this starter
local function inspect_starter(opts, starter_entry)
	pickers
			.new(opts, {
				prompt_title =
				"Browse the starter’s files (Press <CR> to use; <C-t> to open in new buffer; <C-p> to paste into current buffer)",
				finder = finders.new_job(function(prompt)
					return { "fd", prompt, "--base-directory", starter_entry.value.starter_path }
				end, function(fd_output)
					-- Pass the full starter_entry through so we can access the starter info
					return make_entry_from_fd(starter_entry, fd_output)
				end),
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

-- A Telescope picker for finding a starter, given a prompt
-- Uses `jump-start find`. Selecting a starter opens a new
-- Telescope picker (inspect_starter).
--
-- @argument opts - Telescope opts
local function find(opts)
	opts = opts or {}

	pickers
			.new(opts, {
				prompt_title = "Search through jump start starters (Press <CR> to inspect one)",
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
					actions.select_default:replace(function()
						actions.close(prompt_bufnr)
						local starter_entry = action_state.get_selected_entry()
						inspect_starter(opts, starter_entry)
					end)
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
