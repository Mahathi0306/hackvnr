require("dotenv").config();
const XLSX = require("xlsx");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Read Excel
const workbook = XLSX.readFile("dataset.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

// Helper: get or create author (avoid duplicates)
async function getOrCreateAuthor(name, profile_url, avatar_url) {
    if (!name) name = "Unknown";

    // check existing
    const { data: existing } = await supabase
        .from("authors")
        .select("*")
        .eq("name", name)
        .maybeSingle();

    if (existing) return existing;

    // insert new
    const { data, error } = await supabase
        .from("authors")
        .insert({
            name,
            profile_url: profile_url || null,
            avatar_url: avatar_url || null,
        })
        .select()
        .single();

    if (error) {
        console.log("Author insert error:", error.message);
        return null;
    }

    return data;
}

// ETL Runner
async function runETL() {
    console.log(`🚀 Starting ETL for ${rows.length} rows`);

    for (const row of rows) {
        try {
            // -------------------------
            // 1. AUTHOR
            // -------------------------
            const author = await getOrCreateAuthor(
                row["author/name"],
                row["author/profileUrl"],
                row["author/avatar/url"]
            );

            if (!author) continue;

            // -------------------------
            // 2. POST
            // -------------------------
            const { data: post, error: postError } = await supabase
                .from("posts")
                .insert({
                    author_id: author.id,
                    content: row["text"] || "",
                    post_url: row["socialContent/shareUrl"] || null,
                    post_type: row["type"] || null,
                    created_at: row["postedAt"] || new Date(),
                })
                .select()
                .single();

            if (postError) {
                console.log("Post error:", postError.message);
                continue;
            }

            // -------------------------
            // 3. ARTICLE (optional)
            // -------------------------
            if (row["article/title"]) {
                await supabase.from("articles").insert({
                    post_id: post.id,
                    title: row["article/title"],
                    subtitle: row["article/subtitle"] || null,
                    description: row["article/description"] || null,
                    article_url: row["article/url"] || null,
                });
            }

            // -------------------------
            // 4. MEDIA
            // -------------------------
            if (row["article/image/url"]) {
                await supabase.from("media").insert({
                    post_id: post.id,
                    media_url: row["article/image/url"],
                    media_type: "image",
                });
            }

            if (row["article/video/url"]) {
                await supabase.from("media").insert({
                    post_id: post.id,
                    media_url: row["article/video/url"],
                    media_type: "video",
                });
            }

            // -------------------------
            // 5. METRICS
            // -------------------------
            await supabase.from("social_metrics").insert({
                post_id: post.id,
                likes_count: row["likes"] || 0,
                comments_count: row["comments"] || 0,
                reposts_count: row["reposts"] || 0,
                views_count: row["views"] || 0,
                share_url: row["socialContent/shareUrl"] || null,
            });

            console.log(`✅ Inserted post: ${post.id}`);
        } catch (err) {
            console.log("Row error:", err.message);
        }
    }

    console.log("🎉 ETL Completed Successfully");
}

runETL();