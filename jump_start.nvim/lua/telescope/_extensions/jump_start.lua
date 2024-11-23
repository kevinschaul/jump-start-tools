local pickers = require("telescope.pickers")
local finders = require("telescope.finders")
local conf = require("telescope.config").values
local entry_display = require("telescope.pickers.entry_display")

-- Debug setup
local log_file = io.open("./nvim-debug.log", "a")
local function debug_print(...)
	if log_file then
		log_file:write(string.format("[%s] ", os.date("%Y-%m-%d %H:%M:%S")))
		log_file:write(table.concat({ ... }, " ") .. "\n")
		log_file:flush()
	end
end

local function make_entry_from_jump_start(entry)
	debug_print("Processing entry:", vim.inspect(entry))
  -- `jump-start find` prints each result in a tab-delimited format
	local parts = vim.split(entry, "\t")
	-- Pop off the first element, which is the full file path
	local filename = table.remove(parts, 1)

	return {
		value = entry,
		ordinal = entry,
		display = table.concat(parts, "/"),
		filename = filename,
		lnum = 1,
	}
end

local function find_by(search_type, opts)
	opts = opts or {}

	pickers
		.new(opts, {
			prompt_title = "jump-start find by " .. search_type,
			finder = finders.new_job(function(prompt)
				-- Only send the search if there's a prompt
				if prompt ~= "" then
					return { "jump-start", "find", "--" .. search_type, prompt }
				end
				-- Return empty results for empty prompt
				return { "echo", "" }
			end, make_entry_from_jump_start),
			previewer = conf.file_previewer(opts),
		})
		:find()
end

local function find_by_text(opts)
	return find_by("text", opts)
end

local function find_by_code(opts)
	return find_by("code", opts)
end

local function setup(ext_config, config)
	-- ext_config and config are optional
end

return require("telescope").register_extension({
	setup = setup,
	exports = {
		find_by_text = find_by_text,
		find_by_code = find_by_code,
	},
})
