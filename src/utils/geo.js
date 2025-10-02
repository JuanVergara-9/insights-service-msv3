function slugify(s=''){ return String(s).trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,''); }
module.exports = { slugify };
