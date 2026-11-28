package lk.ranowin.admin;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Launcher screen: pick which admin panel to open. Roles are enforced by each backend's login. */
public class MainActivity extends Activity {

    // Same /exec URLs the website already uses (see stock.json "orderEndpoint" and apparel.js APPAREL_API_URL).
    static final String BABY_BAGS_URL =
        "https://script.google.com/macros/s/AKfycbwjLyuEiAOaf6NJW7m2xzrRmNsgVM5SgDrPmSN1nQz7wSL8ZXMR9l0YMcurK9_sroc0/exec";
    static final String TSHIRT_URL =
        "https://script.google.com/macros/s/AKfycbyiQRd5yoYKAQpYNE7vxNYUK0XmHj8S7W2toGWiecJMBnYkpJCcXZ_YuP4VOCXwdRUL/exec";

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        float d = getResources().getDisplayMetrics().density;

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding((int) (28 * d), (int) (28 * d), (int) (28 * d), (int) (28 * d));

        TextView title = new TextView(this);
        title.setText("Ranowin Admin");
        title.setTextSize(28);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(Color.parseColor("#43246F"));
        title.setGravity(Gravity.CENTER);
        root.addView(title);

        TextView sub = new TextView(this);
        sub.setText("Choose a panel, then sign in");
        sub.setTextColor(Color.parseColor("#696274"));
        sub.setGravity(Gravity.CENTER);
        sub.setPadding(0, (int) (6 * d), 0, (int) (28 * d));
        root.addView(sub);

        root.addView(button("Baby Bags Admin", BABY_BAGS_URL, d));
        root.addView(button("T-Shirt (Apparel) Admin", TSHIRT_URL, d));

        setContentView(root);
    }

    private TextView button(String label, final String url, float d) {
        TextView t = new TextView(this);
        t.setText(label);
        t.setTextSize(18);
        t.setTextColor(Color.WHITE);
        t.setGravity(Gravity.CENTER);
        t.setPadding(0, (int) (18 * d), 0, (int) (18 * d));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#55318A"));
        bg.setCornerRadius(14 * d);
        t.setBackground(bg);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.bottomMargin = (int) (14 * d);
        t.setLayoutParams(lp);
        t.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                Intent i = new Intent(MainActivity.this, AdminActivity.class);
                i.putExtra("url", url);
                i.putExtra("title", ((TextView) v).getText().toString());
                startActivity(i);
            }
        });
        return t;
    }
}
