package br.ufpb.motus.model.user;

import br.ufpb.motus.model.show.Episode;
import br.ufpb.motus.model.show.Show;
import com.fasterxml.jackson.annotation.JsonProperty;

public record NextUpItem(
        @JsonProperty("show") Show show,
        @JsonProperty("episode") Episode episode
) {}