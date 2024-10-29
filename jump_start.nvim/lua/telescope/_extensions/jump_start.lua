local pickers = require("telescope.pickers")
local finders = require("telescope.finders")
local conf = require("telescope.config").values

-- split("a,b,c", ",") => {"a", "b", "c"}
local function split(s, sep)
	local fields = {}

	local sep = sep or " "
	local pattern = string.format("([^%s]+)", sep)
	string.gsub(s, pattern, function(c)
		fields[#fields + 1] = c
	end)

	return fields
end

local function make_entry_from_jump_start(entry)
	local parts = split(entry, "\t")
	return {
		value = parts[1],
		display = parts[2] .. "/" .. parts[3],
		ordinal = parts[2] .. "/" .. parts[3],
	}
end

local function find_by_text(opts)
	pickers
			.new(opts, {
				prompt_title = "jump-start find by text",
				finder = finders.new_job(function(prompt)
					return { "jump-start", "find", prompt }
				end, make_entry_from_jump_start),
				sorter = conf.generic_sorter(opts),
			})
			:find()
end

local function find_by_code(opts)
	pickers
			.new(opts, {
				prompt_title = "jump-start find by code",
				finder = finders.new_job(function(prompt)
					return { "jump-start", "find", "--code", prompt }
				end, make_entry_from_jump_start),
				sorter = conf.generic_sorter(opts),
			})
			:find()
end

return require("telescope").register_extension({
	setup = function(ext_config, config) end,
	exports = {
		find_by_text = find_by_text,
		find_by_code = find_by_code
	},
})
